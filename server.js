const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "activities.json");
const DATABASE_URL = process.env.DATABASE_URL || "";

const ENUMS = {
  category: ["external", "internal"],
  sourceType: ["superagent", "manual"],
  joinedCall: ["yes", "no"],
  participationRole: ["lead", "contributor"],
  evidenceAvailable: ["yes", "no"],
  crmLinkStatus: ["no_account", "account_matched_no_opp", "opportunity_linked"],
  dealOutcome: ["open", "win", "loss"],
  commitStatus: ["not_committed", "committed"],
  recordStatus: ["active", "archived"]
};

const TAXONOMIES = {
  activityTypes: [
    { id: "at_customer_call", label: "Customer Call", is_active: true, sort_order: 1 },
    { id: "at_sow", label: "SOW", is_active: true, sort_order: 2 },
    { id: "at_poc", label: "POC", is_active: true, sort_order: 3 },
    { id: "at_rfx", label: "RFx", is_active: true, sort_order: 4 },
    { id: "at_pricing", label: "Pricing", is_active: true, sort_order: 5 },
    { id: "at_other", label: "Other", is_active: true, sort_order: 6 }
  ],
  callTypes: [
    { id: "ct_demo", label: "Demo", is_active: true, sort_order: 1 },
    { id: "ct_discovery", label: "Discovery", is_active: true, sort_order: 2 },
    { id: "ct_follow_up", label: "Follow-up", is_active: true, sort_order: 3 },
    { id: "ct_qbr", label: "QBR / Review", is_active: true, sort_order: 4 },
    { id: "ct_solutioning", label: "Solutioning", is_active: true, sort_order: 5 },
    { id: "ct_poc_working_session", label: "POC Working Session", is_active: true, sort_order: 6 },
    { id: "ct_other", label: "Other", is_active: true, sort_order: 7 }
  ],
  industries: [
    { id: "ind_bfsi", label: "BFSI", is_active: true, sort_order: 1 },
    { id: "ind_retail_ecom", label: "Retail & eCommerce", is_active: true, sort_order: 2 },
    { id: "ind_healthcare", label: "Healthcare", is_active: true, sort_order: 3 },
    { id: "ind_telecom", label: "Telecom", is_active: true, sort_order: 4 },
    { id: "ind_travel_hospitality", label: "Travel & Hospitality", is_active: true, sort_order: 5 },
    { id: "ind_media_entertainment", label: "Media & Entertainment", is_active: true, sort_order: 6 },
    { id: "ind_education", label: "Education", is_active: true, sort_order: 7 },
    { id: "ind_public_sector", label: "Public Sector / Government", is_active: true, sort_order: 8 },
    { id: "ind_manufacturing", label: "Manufacturing", is_active: true, sort_order: 9 },
    { id: "ind_logistics_supply", label: "Logistics & Supply Chain", is_active: true, sort_order: 10 },
    { id: "ind_saas_tech", label: "SaaS / Technology", is_active: true, sort_order: 11 },
    { id: "ind_other", label: "Other", is_active: true, sort_order: 99 }
  ]
};

const USERS = [
  { userId: "u-presales-1", displayName: "Ankit K", email: "ankit@example.com", active: true },
  { userId: "u-presales-2", displayName: "Yashah S", email: "yashah@example.com", active: true },
  { userId: "u-presales-3", displayName: "Ravi S", email: "ravi@example.com", active: true }
];

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

let pool = null;
let storageMode = "file";

function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function validateRequired(record) {
  const required = ["meetingKey", "date", "ownerUserId", "category", "activityTypeId", "summary", "sourceType"];
  return required.filter((key) => !isRequired(record[key]));
}

function cleanArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => isRequired(v)).map((v) => String(v));
}

function normalizeRecord(input, nowIso) {
  const record = { ...input };
  record.id = record.id || crypto.randomUUID();
  record.meetingKey = String(record.meetingKey || "").trim();
  record.summary = String(record.summary || "").trim();
  record.sourceType = record.sourceType || "manual";
  record.category = record.category || "external";
  record.activityTypeId = record.activityTypeId || "";
  record.callTypeId = record.callTypeId || "";
  record.joinedCall = record.joinedCall || "yes";
  record.participationRole = record.participationRole || "contributor";
  record.useCaseIds = cleanArray(record.useCaseIds);
  record.channelIds = cleanArray(record.channelIds);
  record.productIds = cleanArray(record.productIds);
  record.coParticipants = cleanArray(record.coParticipants);
  record.evidenceAvailable = record.evidenceAvailable || "yes";
  record.linkedSourceCount = Number(record.linkedSourceCount || 0);
  record.crmLinkStatus = record.crmLinkStatus || "no_account";
  record.dealOutcome = record.dealOutcome || "open";
  record.sowLinked = Boolean(record.sowLinked);
  record.tagInternalToAccount = Boolean(record.tagInternalToAccount);
  record.commitStatus = record.commitStatus || "not_committed";
  record.recordStatus = record.recordStatus || "active";
  record.externalFingerprint = String(record.externalFingerprint || "");
  record.ingestBatchId = record.ingestBatchId || "manual";
  record.ingestReceivedAt = record.ingestReceivedAt || nowIso;
  record.sourcePayloadHash = record.sourcePayloadHash || "";
  record.updatedAt = nowIso;
  record.createdAt = record.createdAt || nowIso;
  return record;
}

function enforceLeadConstraint(record, activities) {
  if (record.participationRole !== "lead") return;
  const existingLead = activities.find(
    (a) =>
      a.id !== record.id &&
      a.recordStatus !== "archived" &&
      a.meetingKey === record.meetingKey &&
      a.participationRole === "lead"
  );
  if (existingLead) {
    record.participationRole = "contributor";
    record.roleConflictReason = `Lead already assigned to ${existingLead.ownerUserId} (FCFS).`;
  } else {
    record.roleConflictReason = "";
  }
}

function applySfdcConflict(record) {
  const user = USERS.find((u) => u.userId === record.ownerUserId);
  const ownerName = (user?.displayName || "").trim().toLowerCase();
  const sfdcName = String(record.sfdcPresalesRepName || "").trim().toLowerCase();
  if (ownerName && sfdcName && ownerName !== sfdcName) {
    record.sfdcConflictReason = `SFDC rep (${record.sfdcPresalesRepName}) != owner (${user.displayName})`;
  } else {
    record.sfdcConflictReason = "";
  }
}

function upsertByFingerprint(activities, incoming) {
  if (!incoming.externalFingerprint) return { action: "insert", idx: -1 };
  const idx = activities.findIndex((a) => a.externalFingerprint && a.externalFingerprint === incoming.externalFingerprint);
  if (idx === -1) return { action: "insert", idx: -1 };
  return { action: "update", idx };
}

async function initStorage() {
  if (!DATABASE_URL) {
    storageMode = "file";
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ activities: [] }, null, 2), "utf8");
    return;
  }

  storageMode = "postgres";
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      external_fingerprint TEXT UNIQUE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function readStore() {
  if (storageMode === "file") {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return Array.isArray(data.activities) ? data.activities : [];
    } catch {
      return [];
    }
  }
  const result = await pool.query("SELECT data FROM activities ORDER BY updated_at DESC");
  return result.rows.map((r) => r.data);
}

async function writeStore(activities) {
  if (storageMode === "file") {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ activities }, null, 2), "utf8");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE activities");
    for (const a of activities) {
      await client.query(
        `INSERT INTO activities (id, external_fingerprint, data, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, NOW()), COALESCE($5::timestamptz, NOW()))`,
        [a.id, a.externalFingerprint || null, JSON.stringify(a), a.createdAt || null, a.updatedAt || null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

app.get("/api/health", async (req, res) => {
  const activities = await readStore();
  res.json({ status: "ok", app: "presales-impact-phase1", storageMode, activityCount: activities.length });
});

app.get("/api/config/taxonomies", (req, res) => {
  res.json({ enums: ENUMS, taxonomies: TAXONOMIES, users: USERS });
});

app.get("/api/activities", async (req, res) => {
  const activities = await readStore();
  const { month, ownerUserId, commitStatus, sourceType } = req.query;
  let list = activities;
  if (month) list = list.filter((a) => String(a.date || "").startsWith(`${month}`));
  if (ownerUserId) list = list.filter((a) => a.ownerUserId === ownerUserId);
  if (commitStatus) list = list.filter((a) => a.commitStatus === commitStatus);
  if (sourceType) list = list.filter((a) => a.sourceType === sourceType);
  res.json({ items: list });
});

app.get("/api/reports/wins-losses", async (req, res) => {
  const { month, ownerUserId } = req.query;
  let list = (await readStore()).filter((a) => a.recordStatus !== "archived");
  if (month) list = list.filter((a) => String(a.date || "").startsWith(`${month}`));
  if (ownerUserId) list = list.filter((a) => a.ownerUserId === ownerUserId);

  const wins = list.filter((a) => a.crmLinkStatus === "opportunity_linked" && a.dealOutcome === "win").length;
  const losses = list.filter((a) => a.dealOutcome === "loss").length;
  const total = wins + losses;
  const winRate = total ? Number(((wins / total) * 100).toFixed(2)) : 0;
  res.json({ wins, losses, winRate });
});

app.post("/api/activities", async (req, res) => {
  const nowIso = new Date().toISOString();
  const activities = await readStore();
  const record = normalizeRecord(req.body || {}, nowIso);
  const missing = validateRequired(record);
  if (missing.length) return res.status(400).json({ error: "Missing required fields", missing });

  enforceLeadConstraint(record, activities);
  applySfdcConflict(record);
  activities.push(record);
  await writeStore(activities);
  return res.status(201).json({ item: record });
});

app.patch("/api/activities/:id", async (req, res) => {
  const activities = await readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });

  const nowIso = new Date().toISOString();
  const merged = normalizeRecord({ ...activities[idx], ...req.body, id: activities[idx].id, createdAt: activities[idx].createdAt }, nowIso);
  const missing = validateRequired(merged);
  if (missing.length) return res.status(400).json({ error: "Missing required fields", missing });

  enforceLeadConstraint(merged, activities);
  applySfdcConflict(merged);
  activities[idx] = merged;
  await writeStore(activities);
  return res.json({ item: merged });
});

app.patch("/api/activities/:id/commit", async (req, res) => {
  const activities = await readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });

  const status = req.body?.commitStatus || (activities[idx].commitStatus === "committed" ? "not_committed" : "committed");
  if (!ENUMS.commitStatus.includes(status)) return res.status(400).json({ error: "Invalid commitStatus" });

  activities[idx].commitStatus = status;
  activities[idx].updatedAt = new Date().toISOString();
  await writeStore(activities);
  return res.json({ item: activities[idx] });
});

app.post("/api/activities/:id/reject", async (req, res) => {
  const activities = await readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });

  activities[idx].recordStatus = "archived";
  activities[idx].rejectedAt = new Date().toISOString();
  activities[idx].updatedAt = activities[idx].rejectedAt;
  await writeStore(activities);
  return res.json({ item: activities[idx] });
});

app.delete("/api/activities/:id", async (req, res) => {
  const activities = await readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });

  const removed = activities.splice(idx, 1)[0];
  await writeStore(activities);
  return res.json({ deleted: true, item: removed });
});

app.post("/api/superagent/ingest-batch", async (req, res) => {
  const body = req.body || {};
  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length) return res.status(400).json({ error: "records[] is required" });

  const nowIso = new Date().toISOString();
  const activities = await readStore();
  let inserted = 0;
  let updated = 0;
  let conflicts = 0;
  const errors = [];
  const previewItems = [];

  records.forEach((raw, i) => {
    const normalized = normalizeRecord(
      {
        ...raw,
        sourceType: "superagent",
        ingestBatchId: body.ingestBatchId || raw.ingestBatchId || `batch-${nowIso}`
      },
      nowIso
    );

    const missing = validateRequired(normalized);
    if (missing.length) {
      errors.push({ index: i, error: "Missing required fields", missing });
      return;
    }
    if (!normalized.externalFingerprint) {
      errors.push({ index: i, error: "externalFingerprint is required for ingest upsert" });
      return;
    }

    const { action, idx } = upsertByFingerprint(activities, normalized);
    if (action === "update") {
      normalized.id = activities[idx].id;
      normalized.createdAt = activities[idx].createdAt || nowIso;
    }

    enforceLeadConstraint(normalized, activities);
    applySfdcConflict(normalized);
    if (normalized.roleConflictReason || normalized.sfdcConflictReason) conflicts += 1;

    if (action === "update") {
      activities[idx] = normalized;
      updated += 1;
      previewItems.push({ index: i, action: "updated", id: normalized.id, externalFingerprint: normalized.externalFingerprint });
    } else {
      activities.push(normalized);
      inserted += 1;
      previewItems.push({ index: i, action: "inserted", id: normalized.id, externalFingerprint: normalized.externalFingerprint });
    }
  });

  if (body.dryRun === true) {
    return res.json({
      dryRun: true,
      ingestBatchId: body.ingestBatchId || `batch-${nowIso}`,
      attempted: records.length,
      inserted,
      updated,
      conflicts,
      errors,
      previewItems
    });
  }

  await writeStore(activities);
  return res.status(errors.length ? 207 : 200).json({
    ingestBatchId: body.ingestBatchId || `batch-${nowIso}`,
    attempted: records.length,
    inserted,
    updated,
    conflicts,
    errors,
    items: previewItems
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Presales Impact Console running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize storage:", err);
    process.exit(1);
  });
