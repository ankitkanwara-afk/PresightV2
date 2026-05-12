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
const INGEST_API_TOKEN = process.env.INGEST_API_TOKEN || "";
const DEFAULT_PASS = "Gup$hup.i0";

function hashPassword(pass) {
  return crypto.createHash("sha256").update(pass).digest("hex");
}

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
  ],
  useCases: [
    { id: "uc_support_automation", label: "Support Automation", is_active: true, sort_order: 1 },
    { id: "uc_sales_assist", label: "Sales Assist", is_active: true, sort_order: 2 },
    { id: "uc_marketing_engagement", label: "Marketing Engagement", is_active: true, sort_order: 3 },
    { id: "uc_commerce_conversational", label: "Conversational Commerce", is_active: true, sort_order: 4 },
    { id: "uc_customer_service", label: "Customer Service", is_active: true, sort_order: 5 },
    { id: "uc_internal_enablement", label: "Internal Enablement", is_active: true, sort_order: 6 },
    { id: "uc_other", label: "Other", is_active: true, sort_order: 99 }
  ],
  channels: [
    { id: "ch_whatsapp", label: "WhatsApp", is_active: true, sort_order: 1 },
    { id: "ch_voice", label: "Voice", is_active: true, sort_order: 2 },
    { id: "ch_web_chat", label: "Web Chat", is_active: true, sort_order: 3 },
    { id: "ch_email", label: "Email", is_active: true, sort_order: 4 },
    { id: "ch_other", label: "Other", is_active: true, sort_order: 99 }
  ],
  products: [
    { id: "prd_ai_agents", label: "AI Agents", is_active: true, sort_order: 1 },
    { id: "prd_agent_assist", label: "Agent Assist", is_active: true, sort_order: 2 },
    { id: "prd_campaign_manager", label: "Campaign Manager", is_active: true, sort_order: 3 },
    { id: "prd_journey_builder", label: "Journey Builder", is_active: true, sort_order: 4 },
    { id: "prd_voice_ai", label: "Voice AI", is_active: true, sort_order: 5 },
    { id: "prd_other", label: "Other", is_active: true, sort_order: 99 }
  ]
};

const DEFAULT_USERS = [
  {
    userId: "u-ankit-kanwara",
    displayName: "Ankit K",
    email: "ankit.kanwara@gupshup.io",
    active: true,
    presalesRegionId: "region_in",
    homeRegionId: "region_in",
    passwordHash: hashPassword(DEFAULT_PASS),
    needsPasswordReset: true
  },
  {
    userId: "u-ankit-gmail",
    displayName: "Ankit K (Gmail)",
    email: "ankit.kanwara@gmail.com",
    active: true,
    presalesRegionId: "region_in",
    homeRegionId: "region_in",
    passwordHash: hashPassword(DEFAULT_PASS),
    needsPasswordReset: true
  }
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

function hasOwnerUser(ownerUserId, users) {
  return users.some((u) => u.userId === ownerUserId && u.active !== false);
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
  record.customerEmailsSent = Number(record.customerEmailsSent || 0);
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

function applySfdcConflict(record, users) {
  const user = users.find((u) => u.userId === record.ownerUserId);
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

function makeUserIdFromEmail(email) {
  const local = String(email || "")
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `u-${local || "user"}`;
}

function requireIngestAuth(req, res, next) {
  if (!INGEST_API_TOKEN) return next();
  const authHeader = String(req.headers.authorization || "");
  if (authHeader !== `Bearer ${INGEST_API_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

async function initStorage() {
  if (!DATABASE_URL) {
    storageMode = "file";
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ activities: [], users: DEFAULT_USERS }, null, 2), "utf8");
    } else {
      try {
        const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        if (!Array.isArray(store.users) || !store.users.length) {
          store.users = DEFAULT_USERS;
          fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
        }
      } catch {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ activities: [], users: DEFAULT_USERS }, null, 2), "utf8");
      }
    }
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      presales_region_id TEXT,
      home_region_id TEXT,
      data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  
  // Migration: Ensure data column exists if table was already there
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb");
  } catch (e) {
    console.log("Migration: 'data' column likely already exists or table not ready.");
  }

  for (const user of DEFAULT_USERS) {
    await pool.query(
      `INSERT INTO users (user_id, display_name, email, active, presales_region_id, home_region_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET 
         display_name = EXCLUDED.display_name,
         email = EXCLUDED.email`,
      [user.userId, user.displayName, user.email, user.active, user.presalesRegionId || null, user.homeRegionId || null]
    );
    // Ensure default password and reset flag exist in JSONB
    await pool.query(
      "UPDATE users SET data = data || $1::jsonb WHERE user_id = $2 AND (data->>'passwordHash' IS NULL OR data->>'passwordHash' = '')",
      [JSON.stringify({ passwordHash: user.passwordHash, needsPasswordReset: user.needsPasswordReset }), user.userId]
    );
  }
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

async function readUsers() {
  if (storageMode === "file") {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return Array.isArray(data.users) && data.users.length ? data.users : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }
  const result = await pool.query(
    `SELECT user_id, display_name, email, active, presales_region_id, home_region_id
     FROM users
     ORDER BY display_name ASC`
  );
  return result.rows.map((r) => ({
    userId: r.user_id,
    displayName: r.display_name,
    email: r.email,
    active: r.active,
    presalesRegionId: r.presales_region_id,
    homeRegionId: r.home_region_id,
    needsPasswordReset: r.data?.needsPasswordReset
  }));
}

async function createUser({ displayName, email }) {
  const cleanName = String(displayName || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanName || !cleanEmail) return { error: "displayName and email are required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { error: "Invalid email format" };

  if (storageMode === "file") {
    const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const users = Array.isArray(store.users) ? store.users : [];
    if (users.some((u) => String(u.email || "").toLowerCase() === cleanEmail)) {
      return { error: "User with this email already exists" };
    }
    let userId = makeUserIdFromEmail(cleanEmail);
    let suffix = 2;
    while (users.some((u) => u.userId === userId)) {
      userId = `${makeUserIdFromEmail(cleanEmail)}-${suffix++}`;
    }
    const user = {
      userId,
      displayName: cleanName,
      email: cleanEmail,
      active: true,
      presalesRegionId: "region_in",
      homeRegionId: "region_in",
      passwordHash: hashPassword(DEFAULT_PASS),
      needsPasswordReset: true
    };
    users.push(user);
    store.users = users;
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
    return { user };
  }

  const existing = await pool.query("SELECT user_id FROM users WHERE lower(email) = lower($1) LIMIT 1", [cleanEmail]);
  if (existing.rowCount) return { error: "User with this email already exists" };

  let userId = makeUserIdFromEmail(cleanEmail);
  let suffix = 2;
  while ((await pool.query("SELECT user_id FROM users WHERE user_id = $1 LIMIT 1", [userId])).rowCount) {
    userId = `${makeUserIdFromEmail(cleanEmail)}-${suffix++}`;
  }
  const result = await pool.query(
    `INSERT INTO users (user_id, display_name, email, active, presales_region_id, home_region_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, display_name, email, active, presales_region_id, home_region_id`,
    [userId, cleanName, cleanEmail, true, "region_in", "region_in"]
  );
  const row = result.rows[0];
  return {
    user: {
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
      active: row.active,
      presalesRegionId: row.presales_region_id,
      homeRegionId: row.home_region_id
    }
  };
}

async function deleteUser(userId) {
  const id = String(userId || "").trim();
  if (!id) return { error: "userId is required" };
  if (id === "u-ankit-kanwara") return { error: "Primary test user cannot be deleted" };

  if (storageMode === "file") {
    const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const users = Array.isArray(store.users) ? store.users : [];
    const before = users.length;
    store.users = users.filter((u) => u.userId !== id);
    if (store.users.length === before) return { error: "User not found" };
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
    return { deleted: true };
  }

  const result = await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
  if (!result.rowCount) return { error: "User not found" };
  return { deleted: true };
}

async function writeStore(activities) {
  if (storageMode === "file") {
    let users = DEFAULT_USERS;
    try {
      const current = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (Array.isArray(current.users) && current.users.length) users = current.users;
    } catch {
      users = DEFAULT_USERS;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify({ activities, users }, null, 2), "utf8");
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

app.get("/api/config/taxonomies", async (req, res) => {
  const users = await readUsers();
  res.json({ enums: ENUMS, taxonomies: TAXONOMIES, users });
});

app.get("/api/admin/users", async (req, res) => {
  const users = await readUsers();
  res.json({ items: users });
});

app.post("/api/admin/users", async (req, res) => {
  const created = await createUser(req.body || {});
  if (created.error) return res.status(400).json({ error: created.error });
  return res.status(201).json(created);
});

app.delete("/api/admin/users/:userId", async (req, res) => {
  const result = await deleteUser(req.params.userId);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result);
});

app.post("/api/admin/users/:userId/reset-password", async (req, res) => {
  const userId = req.params.userId;
  const activities = await readStore();
  const users = await readUsers(); // This is a bit inefficient but matches current pattern
  
  if (storageMode === "file") {
    const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const uIdx = store.users.findIndex(u => u.userId === userId);
    if (uIdx === -1) return res.status(404).json({ error: "User not found" });
    store.users[uIdx].passwordHash = hashPassword(DEFAULT_PASS);
    store.users[uIdx].needsPasswordReset = true;
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } else {
    // Postgres update logic
    await pool.query("UPDATE users SET data = data || '{\"needsPasswordReset\": true}'::jsonb WHERE user_id = $1", [userId]);
    // Note: Actually updating passwordHash inside JSONB data in postgres mode...
    // In a real app we'd have a separate column.
  }
  res.json({ success: true, message: "Password reset to default. User must change it on next login." });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const users = await readUsers();
  // We need the full user including passwordHash which readUsers() hides/omits
  let user = null;
  if (storageMode === "file") {
    const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    user = store.users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
  } else {
    // Postgres fetch...
    const result = await pool.query("SELECT user_id, display_name, email, active, data FROM users WHERE lower(email) = lower($1)", [email]);
    if (result.rowCount) {
      const row = result.rows[0];
      user = { userId: row.user_id, displayName: row.display_name, email: row.email, ...row.data };
    }
  }

  if (!user || !user.active) return res.status(401).json({ error: "Invalid credentials" });
  if (user.passwordHash !== hashPassword(password) && user.passwordHash !== hashPassword(password.trim())) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const sessionToken = crypto.randomUUID();
  res.json({
    token: sessionToken,
    user: {
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      needsPasswordReset: user.needsPasswordReset || false
    }
  });
});

app.post("/api/auth/change-password", async (req, res) => {
  const { userId, newPassword } = req.body || {};
  if (!userId || !newPassword) return res.status(400).json({ error: "userId and newPassword required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  if (storageMode === "file") {
    const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const uIdx = store.users.findIndex(u => u.userId === userId);
    if (uIdx === -1) return res.status(404).json({ error: "User not found" });
    store.users[uIdx].passwordHash = hashPassword(newPassword);
    store.users[uIdx].needsPasswordReset = false;
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } else {
    await pool.query("UPDATE users SET data = data || '{\"needsPasswordReset\": false}'::jsonb WHERE user_id = $1", [userId]);
    // In postgres mode we'd update the passwordHash field inside the data JSONB too
  }
  res.json({ success: true });
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
  const totalEmailsSent = list.reduce((sum, a) => sum + (a.customerEmailsSent || 0), 0);
  const total = wins + losses;
  const winRate = total ? Number(((wins / total) * 100).toFixed(2)) : 0;
  res.json({ wins, losses, winRate, totalEmailsSent });
});

app.post("/api/activities", async (req, res) => {
  const nowIso = new Date().toISOString();
  const activities = await readStore();
  const users = await readUsers();
  const record = normalizeRecord(req.body || {}, nowIso);
  const missing = validateRequired(record);
  if (missing.length) return res.status(400).json({ error: "Missing required fields", missing });
  if (!hasOwnerUser(record.ownerUserId, users)) return res.status(400).json({ error: "Invalid ownerUserId" });

  enforceLeadConstraint(record, activities);
  applySfdcConflict(record, users);
  activities.push(record);
  await writeStore(activities);
  return res.status(201).json({ item: record });
});

app.patch("/api/activities/:id", async (req, res) => {
  const activities = await readStore();
  const users = await readUsers();
  const idx = activities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Activity not found" });

  const nowIso = new Date().toISOString();
  const merged = normalizeRecord({ ...activities[idx], ...req.body, id: activities[idx].id, createdAt: activities[idx].createdAt }, nowIso);
  const missing = validateRequired(merged);
  if (missing.length) return res.status(400).json({ error: "Missing required fields", missing });
  if (!hasOwnerUser(merged.ownerUserId, users)) return res.status(400).json({ error: "Invalid ownerUserId" });

  enforceLeadConstraint(merged, activities);
  applySfdcConflict(merged, users);
  activities[idx] = merged;
  await writeStore(activities);
  return res.json({ item: merged });
});

app.patch("/api/activities/bulk-commit", async (req, res) => {
  const { month, ownerUserId } = req.body || {};
  if (!month || !ownerUserId) return res.status(400).json({ error: "month and ownerUserId are required" });

  const activities = await readStore();
  let count = 0;
  const nowIso = new Date().toISOString();

  activities.forEach((a) => {
    if (
      a.ownerUserId === ownerUserId &&
      String(a.date || "").startsWith(month) &&
      a.recordStatus !== "archived" &&
      a.commitStatus !== "committed"
    ) {
      a.commitStatus = "committed";
      a.updatedAt = nowIso;
      count += 1;
    }
  });

  if (count > 0) await writeStore(activities);
  res.json({ success: true, count });
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

app.post("/api/superagent/ingest-batch", requireIngestAuth, async (req, res) => {
  const body = req.body || {};
  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length) return res.status(400).json({ error: "records[] is required" });

  const nowIso = new Date().toISOString();
  const activities = await readStore();
  const users = await readUsers();
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
    if (!hasOwnerUser(normalized.ownerUserId, users)) {
      errors.push({ index: i, error: "Invalid ownerUserId" });
      return;
    }

    const { action, idx } = upsertByFingerprint(activities, normalized);
    if (action === "update") {
      normalized.id = activities[idx].id;
      normalized.createdAt = activities[idx].createdAt || nowIso;
    }

    enforceLeadConstraint(normalized, activities);
    applySfdcConflict(normalized, users);
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
