const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "activities.json");

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
    { id: "at_other", label: "Other", is_active: true, sort_order: 5 }
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
    { id: "ind_saas_tech", label: "SaaS / Technology", is_active: true, sort_order: 5 },
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

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ activities: [] }, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(data.activities) ? data.activities : [];
  } catch {
    return [];
  }
}

function writeStore(activities) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ activities }, null, 2), "utf8");
}

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

app.get("/api/health", (req, res) => {
  const activities = readStore();
  res.json({ status: "ok", app: "presales-impact-phase1", activityCount: activities.length });
});

app.get("/api/config/taxonomies", (req, res) => {
  res.json({ enums: ENUMS, taxonomies: TAXONOMIES, users: USERS });
});

app.get("/api/activities", (req, res) => {
  const activities = readStore();
  const { month, ownerUserId, commitStatus, sourceType } = req.query;
  let list = activities;
  if (month) list = list.filter((a) => String(a.date || "").startsWith(`${month}`));
  if (ownerUserId) list = list.filter((a) => a.ownerUserId === ownerUserId);
  if (commitStatus) list = list.filter((a) => a.commitStatus === commitStatus);
  if (sourceType) list = list.filter((a) => a.sourceType === sourceType);
  res.json({ items: list });
});

app.get("/api/reports/wins-losses", (req, res) => {
  const { month, ownerUserId } = req.query;
  let list = readStore().filter((a) => a.recordStatus !== "archived");
  if (month) list = list.filter((a) => String(a.date || "").startsWith(`${month}`));
  if (ownerUserId) list = list.filter((a) => a.ownerUserId === ownerUserId);

  const wins = list.filter((a) => a.crmLinkStatus === "opportunity_linked" && a.dealOutcome === "win").length;
  const losses = list.filter((a) => a.dealOutcome === "loss").length;
  const total = wins + losses;
  const winRate = total ? Number(((wins / total) * 100).toFixed(2)) : 0;
  res.json({ wins, losses, winRate });
});

app.post("/api/activities", (req, res) => {
  const nowIso = new Date().toISOString();
  const activities = readStore();
  const record = normalizeRecord(req.body || {}, nowIso);
  const missing = validateRequired(record);
  if (missing.length) {
    return res.status(400).json({ error: "Missing required fields", missing });
  }
  enforceLeadConstraint(record, activities);
  applySfdcConflict(record);
  activities.push(record);
  writeStore(activities);
  return res.status(201).json({ item: record });
});

app.patch("/api/activities/:id", (req, res) => {
  const activities = readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });
  const nowIso = new Date().toISOString();
  const merged = normalizeRecord({ ...activities[idx], ...req.body, id: activities[idx].id, createdAt: activities[idx].createdAt }, nowIso);
  const missing = validateRequired(merged);
  if (missing.length) return res.status(400).json({ error: "Missing required fields", missing });
  enforceLeadConstraint(merged, activities);
  applySfdcConflict(merged);
  activities[idx] = merged;
  writeStore(activities);
  return res.json({ item: merged });
});

app.patch("/api/activities/:id/commit", (req, res) => {
  const activities = readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });
  const status = req.body?.commitStatus || (activities[idx].commitStatus === "committed" ? "not_committed" : "committed");
  if (!ENUMS.commitStatus.includes(status)) return res.status(400).json({ error: "Invalid commitStatus" });
  activities[idx].commitStatus = status;
  activities[idx].updatedAt = new Date().toISOString();
  writeStore(activities);
  return res.json({ item: activities[idx] });
});

app.post("/api/activities/:id/reject", (req, res) => {
  const activities = readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });
  activities[idx].recordStatus = "archived";
  activities[idx].rejectedAt = new Date().toISOString();
  activities[idx].updatedAt = activities[idx].rejectedAt;
  writeStore(activities);
  return res.json({ item: activities[idx] });
});

app.delete("/api/activities/:id", (req, res) => {
  const activities = readStore();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });
  const removed = activities.splice(idx, 1)[0];
  writeStore(activities);
  return res.json({ deleted: true, item: removed });
});

app.post("/api/superagent/ingest-batch", (req, res) => {
  const body = req.body || {};
  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length) return res.status(400).json({ error: "records[] is required" });

  const nowIso = new Date().toISOString();
  const activities = readStore();
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

  writeStore(activities);
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

app.listen(PORT, () => {
  ensureStore();
  console.log(`Presales Impact Console running on http://localhost:${PORT}`);
});
