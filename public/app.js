function toLocalMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toLocalDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const currentMonth = "2026-05";
const currentUserId = "u-ankit-kanwara";

const ACTIVITY_TYPES = [
  ["at_customer_call", "Customer Call"],
  ["at_sow", "SOW"],
  ["at_poc", "POC"],
  ["at_rfx", "RFx"],
  ["at_pricing", "Pricing"],
  ["at_other", "Other"]
];
const CALL_TYPES = [
  ["ct_demo", "Demo"],
  ["ct_discovery", "Discovery"],
  ["ct_follow_up", "Follow-up"],
  ["ct_qbr", "QBR / Review"],
  ["ct_solutioning", "Solutioning"],
  ["ct_poc_working_session", "POC Working Session"],
  ["ct_other", "Other"]
];
const INDUSTRIES = [
  ["ind_bfsi", "BFSI"],
  ["ind_retail_ecom", "Retail & eCommerce"],
  ["ind_healthcare", "Healthcare"],
  ["ind_telecom", "Telecom"],
  ["ind_saas_tech", "SaaS / Technology"],
  ["ind_other", "Other"]
];
const USE_CASES = [
  ["uc_support_automation", "Support Automation"],
  ["uc_sales_assist", "Sales Assist"],
  ["uc_marketing_engagement", "Marketing Engagement"],
  ["uc_commerce_conversational", "Conversational Commerce"],
  ["uc_customer_service", "Customer Service"],
  ["uc_other", "Other"]
];
const CHANNELS = [
  ["ch_whatsapp", "WhatsApp"],
  ["ch_voice", "Voice"],
  ["ch_web_chat", "Web Chat"],
  ["ch_email", "Email"],
  ["ch_other", "Other"]
];
const PRODUCTS = [
  ["prd_ai_agents", "AI Agents"],
  ["prd_agent_assist", "Agent Assist"],
  ["prd_campaign_manager", "Campaign Manager"],
  ["prd_journey_builder", "Journey Builder"],
  ["prd_voice_ai", "Voice AI"],
  ["prd_other", "Other"]
];

let labelMap = Object.fromEntries([...ACTIVITY_TYPES, ...CALL_TYPES, ...INDUSTRIES, ...USE_CASES, ...CHANNELS, ...PRODUCTS]);

const seed = {
  version: 12,
  users: [{ id: "u-ankit-kanwara", name: "Ankit K", email: "ankit.kanwara@gupshup.io", role: "presales", active: true, presalesRegionId: "region_in" }],
  defaults: {
    category: "external",
    activityTypeId: "at_customer_call",
    callTypeId: "ct_discovery",
    sourceType: "superagent",
    commitStatus: "not_committed"
  },
  activities: []
};

let state = loadState();
let editingActivityId = null;
let activityViewMode = "all";
let activeMonth = currentMonth;
const API_BASE = "";

function loadState() {
  const raw = localStorage.getItem("phase1-presales-impact");
  if (!raw) return structuredClone(seed);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.version || parsed.version < 12) return structuredClone(seed);
    return parsed;
  } catch {
    return structuredClone(seed);
  }
}
function persist() {
  localStorage.setItem("phase1-presales-impact", JSON.stringify(state));
}
function monthKey(d) {
  return (d || "").slice(0, 7);
}
function selectedMonth() {
  return activeMonth;
}
function userName(id) {
  return state.users.find((u) => u.id === id)?.name || id;
}

let sessionUser = null;
let sessionToken = localStorage.getItem("presight-session-token");
if (sessionToken) {
  const storedUser = localStorage.getItem("presight-session-user");
  if (storedUser) sessionUser = JSON.parse(storedUser);
}

function checkAuth() {
  if (!sessionToken || !sessionUser) {
    document.getElementById("loginOverlay").classList.remove("hidden");
    return false;
  }
  if (sessionUser.needsPasswordReset) {
    document.getElementById("passwordResetOverlay").classList.remove("hidden");
    return false;
  }
  return true;
}
function normalizeUsers(list) {
  return (Array.isArray(list) ? list : []).map((u) => ({
    id: u.id || u.userId,
    name: u.name || u.displayName,
    email: u.email || "",
    active: u.active !== false,
    presalesRegionId: u.presalesRegionId || "",
    homeRegionId: u.homeRegionId || ""
  }));
}
function monthActivities() {
  return state.activities
    .filter((a) => a.ownerUserId === currentUserId)
    .filter((a) => a.recordStatus !== "archived")
    .filter((a) => monthKey(a.date) === selectedMonth());
}
function activitiesForCurrentView() {
  const list = monthActivities();
  if (activityViewMode === "pending") return list.filter((a) => a.commitStatus !== "committed");
  return list;
}
function countWhere(list, p) {
  return list.filter(p).length;
}
function chipClass(status) {
  return status === "committed" ? "ok" : "warn";
}
function fillSelect(el, pairs, includeBlank = false, blank = "Select") {
  const html = pairs.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  el.innerHTML = `${includeBlank ? `<option value="">${blank}</option>` : ""}${html}`;
}
function setMulti(select, values) {
  const s = new Set(values || []);
  Array.from(select.options).forEach((o) => (o.selected = s.has(o.value)));
}
function getMulti(select) {
  return Array.from(select.selectedOptions).map((o) => o.value);
}
function isClientMeeting(a) {
  return a.category === "external" && a.activityTypeId === "at_customer_call";
}
function otherActivityCount(list) {
  const otherSet = new Set(["at_sow", "at_poc", "at_rfx", "at_pricing", "at_other"]);
  return countWhere(list, (a) => a.category === "external" && otherSet.has(a.activityTypeId));
}
function uniqueClientMeetings(list) {
  return new Set(list.filter(isClientMeeting).map((a) => a.meetingKey)).size;
}
function winsLosses(list) {
  // Fallback local calculation if API fails
  const wins = countWhere(list, (a) => a.crmLinkStatus === "opportunity_linked" && a.dealOutcome === "win");
  const losses = countWhere(list, (a) => a.dealOutcome === "loss");
  const total = wins + losses;
  return { wins, losses, rate: total ? `${Math.round((wins / total) * 100)}%` : "0%" };
}

let apiReportData = null;

function setView(viewId) {
  if (!checkAuth()) return;
  ["dashboardView", "activitiesView", "winsView", "reportsView", "adminView"].forEach((id) => {
    document.getElementById(id).classList.toggle("hidden", id !== viewId);
    document.getElementById(id).classList.toggle("active-view", id === viewId);
  });
  document.querySelectorAll(".nav-item[data-nav-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.navView === viewId);
  });
}

function renderDashboardCards() {
  const list = monthActivities();
  const wl = winsLosses(list);
  const committed = countWhere(list, (a) => a.commitStatus === "committed");
  const pending = countWhere(list, (a) => a.commitStatus !== "committed");
  const cards = [
    {
      id: "commit-focus",
      title: "Committed vs Pending Commit",
      value: `${committed} / ${pending}`,
      note: "Tap to open pending commit items",
      target: "activitiesView",
      mode: "pending",
      priority: true
    },
    {
      id: "meetings",
      title: "Meetings This Month - Client Facing",
      value: uniqueClientMeetings(list),
      note: "Unique client meetings",
      target: "activitiesView",
      mode: "all"
    },
    {
      id: "other",
      title: "Other Activities",
      value: otherActivityCount(list),
      note: "SOW + POC + RFx + Pricing + Others",
      target: "activitiesView",
      mode: "all"
    },
    {
      id: "internal",
      title: "Internal Activities Total",
      value: countWhere(list, (a) => a.category === "internal"),
      note: "Internal work logged",
      target: "activitiesView",
      mode: "all"
    },
    {
      id: "emails",
      title: "Customer Emails Sent",
      value: apiReportData?.totalEmailsSent || 0,
      note: "Total emails logged by SuperAgent",
      target: "dashboardView"
    },
    {
      id: "wins",
      title: "SFDC Wins & Losses",
      value: apiReportData ? `${apiReportData.wins} Win and ${apiReportData.losses} Loss` : `${wl.wins} Win and ${wl.losses} Loss`,
      note: apiReportData ? `Win rate ${apiReportData.winRate}%` : `Win rate ${wl.rate}`,
      target: "winsView"
    },
    {
      id: "my",
      title: "My Activity",
      value: list.length,
      note: "Open logged activity page",
      target: "activitiesView",
      mode: "all"
    },
    {
      id: "reports",
      title: "Report View",
      value: "Open",
      note: "Manager reporting workbench",
      target: "reportsView"
    },
    {
      id: "admin",
      title: "Admin",
      value: "Open",
      note: "Users and configuration",
      target: "adminView"
    }
  ];

  document.getElementById("dashboardCards").innerHTML = cards
    .map(
      (c) => `<button type="button" class="kpi dashboard-card ${c.priority ? "dashboard-card-priority" : ""}" data-target="${c.target}" data-mode="${c.mode || ""}">
        <div class="label">${c.title}</div>
        <div class="value">${c.value}</div>
        <div class="card-note">${c.note}</div>
      </button>`
    )
    .join("");
}

function renderActivitiesTables() {
  const all = monthActivities().sort((a, b) => (a.date < b.date ? 1 : -1));
  const pending = all.filter((a) => a.commitStatus !== "committed");
  const committed = all.filter((a) => a.commitStatus === "committed");

  renderTableRows("#pendingActivityTable tbody", pending, "pending");
  renderTableRows("#committedActivityTable tbody", committed, "committed");
}

function renderTableRows(selector, rows, mode) {
  const tbody = document.querySelector(selector);
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7">No ${mode} records for this month.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((a) => {
      return `<tr>
        <td>${a.date}</td>
        <td><span class="chip ${a.sourceType === "superagent" ? "ok" : "warn"}">${a.sourceType}</span></td>
        <td>${labelMap[a.activityTypeId] || "-"}</td>
        <td>${a.accountName || "-"}</td>
        <td class="description-cell">${a.summary || "-"}</td>
        <td>${a.customerEmailsSent || 0}</td>
        <td>
          <button class="tiny-btn" data-action="edit" data-id="${a.id}" type="button">Edit</button>
          <button class="tiny-btn" data-action="commit" data-id="${a.id}" type="button">${a.commitStatus === "committed" ? "Uncommit" : "Commit"}</button>
          <button class="tiny-btn secondary-btn" data-action="reject" data-id="${a.id}" type="button">Reject</button>
        </td>
      </tr>`;
    })
    .join("");
}

function renderWinsTable() {
  const rows = monthActivities()
    .filter((a) => a.crmLinkStatus === "opportunity_linked" && (a.dealOutcome === "win" || a.dealOutcome === "loss"))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const tbody = document.querySelector("#winsTable tbody");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">No SFDC linked wins/losses for selected month.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (a) => `<tr>
        <td>${a.sfdcOpportunityId || "-"}</td>
        <td>${a.accountName || "-"}</td>
        <td><span class="chip ${a.dealOutcome === "win" ? "ok" : "warn"}">${a.dealOutcome}</span></td>
        <td>${userName(a.ownerUserId)}</td>
        <td>${a.sfdcOpportunityLink ? `<a href="${a.sfdcOpportunityLink}" target="_blank" rel="noreferrer">Open in SFDC</a>` : "-"}</td>
      </tr>`
    )
    .join("");
}

function renderAdminUsersTable() {
  const tbody = document.querySelector("#adminUsersTable tbody");
  if (!tbody) return;
  const rows = (state.users || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4">No users found.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (u) => `<tr>
      <td>${u.id}</td>
      <td>${u.name || "-"}</td>
      <td>${u.email || "-"}</td>
      <td>${u.active ? "Yes" : "No"}</td>
      <td>
        <button class="tiny-btn secondary-btn" data-action="reset-pass" data-id="${u.id}" type="button">Reset Password</button>
      </td>
    </tr>`
    )
    .join("");
}

function enforceLeadRule(payload) {
  if (payload.participationRole !== "lead") return;
  const existingLead = state.activities.find(
    (a) => a.id !== payload.id && a.recordStatus !== "archived" && a.meetingKey === payload.meetingKey && a.participationRole === "lead"
  );
  if (existingLead) {
    payload.participationRole = "contributor";
    alert(`Lead already set by ${userName(existingLead.ownerUserId)}. Saved as contributor (FCFS).`);
  }
}

function applyDefaults(form) {
  Object.entries(state.defaults).forEach(([k, v]) => {
    if (form.elements[k]) form.elements[k].value = v;
  });
  form.elements.date.value = toLocalDate();
  form.elements.ownerUserId.value = currentUserId;
  form.elements.meetingKey.value = "";
  form.elements.summary.value = "";
  form.elements.nextSteps.value = "";
  form.elements.valueDerived.value = "";
  form.elements.accountName.value = "";
  form.elements.sfdcOpportunityId.value = "";
  form.elements.sfdcOpportunityLink.value = "";
  form.elements.sfdcPresalesRepName.value = "";
  form.elements.linkedSourceCount.value = "1";
  form.elements.category.value = "external";
  form.elements.joinedCall.value = "yes";
  form.elements.participationRole.value = "lead";
  form.elements.evidenceAvailable.value = "yes";
  form.elements.crmLinkStatus.value = "no_account";
  form.elements.dealOutcome.value = "open";
  form.elements.sowLinked.value = "false";
  form.elements.customerEmailsSent.value = "0";
  form.elements.tagInternalToAccount.checked = false;
  setMulti(form.elements.coParticipants, []);
  setMulti(form.elements.useCaseIds, []);
  setMulti(form.elements.channelIds, []);
  setMulti(form.elements.productIds, []);
}

function populateForm(a) {
  const form = document.getElementById("activityForm");
  form.elements.date.value = a.date || "";
  form.elements.ownerUserId.value = a.ownerUserId || currentUserId;
  form.elements.sourceType.value = a.sourceType || "manual";
  form.elements.category.value = a.category || "external";
  form.elements.activityTypeId.value = a.activityTypeId || "at_customer_call";
  form.elements.callTypeId.value = a.callTypeId || "";
  form.elements.meetingKey.value = a.meetingKey || "";
  form.elements.joinedCall.value = a.joinedCall || "yes";
  form.elements.participationRole.value = a.participationRole || "lead";
  setMulti(form.elements.coParticipants, a.coParticipants || []);
  form.elements.accountName.value = a.accountName || "";
  form.elements.industryId.value = a.industryId || "";
  setMulti(form.elements.useCaseIds, a.useCaseIds || []);
  setMulti(form.elements.channelIds, a.channelIds || []);
  setMulti(form.elements.productIds, a.productIds || []);
  form.elements.valueDerived.value = a.valueDerived || "";
  form.elements.evidenceAvailable.value = a.evidenceAvailable || "yes";
  form.elements.linkedSourceCount.value = String(a.linkedSourceCount ?? 1);
  form.elements.summary.value = a.summary || "";
  form.elements.nextSteps.value = a.nextSteps || "";
  form.elements.sfdcOpportunityId.value = a.sfdcOpportunityId || "";
  form.elements.sfdcOpportunityLink.value = a.sfdcOpportunityLink || "";
  form.elements.sfdcPresalesRepName.value = a.sfdcPresalesRepName || "";
  form.elements.crmLinkStatus.value = a.crmLinkStatus || "no_account";
  form.elements.dealOutcome.value = a.dealOutcome || "open";
  form.elements.sowLinked.value = a.sowLinked ? "true" : "false";
  form.elements.customerEmailsSent.value = String(a.customerEmailsSent || 0);
  form.elements.tagInternalToAccount.checked = Boolean(a.tagInternalToAccount);
  form.elements.commitStatus.value = a.commitStatus || "not_committed";
}

function openModal() {
  document.getElementById("logModalBackdrop").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("logModalBackdrop").classList.add("hidden");
}
function setModalMode(edit) {
  document.getElementById("activityModalTitle").textContent = edit ? "Update Activity" : "Log Activity";
  document.getElementById("saveActivityBtn").textContent = edit ? "Update Activity" : "Save Activity";
}

function shiftMonth(direction) {
  const [yy, mm] = (activeMonth || currentMonth).split("-").map(Number);
  const dt = new Date(yy, mm - 1 + direction, 1);
  activeMonth = toLocalMonth(dt);
  refresh().catch(console.error);
}

function monthTitle(monthStr) {
  const [yy, mm] = monthStr.split("-").map(Number);
  return new Date(yy, mm - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

async function refresh() {
  if (!checkAuth()) return;
  const month = selectedMonth();
  const modeLabel = activityViewMode === "pending" ? "Pending Commit" : "All";
  document.getElementById("listTitle").textContent = `My Activities - ${month} (${modeLabel})`;
  document.getElementById("activeMonthLabel").textContent = monthTitle(month);
  
  console.log(`Refreshing UI for month=${month}, user=${currentUserId}`);

  try {
    // 1. Fetch Activities
    const actRes = await fetch(`${API_BASE}/api/activities?month=${month}&ownerUserId=${currentUserId}`);
    const actData = await actRes.json();
    console.log("Activities API Response:", actData);
    
    if (actData && Array.isArray(actData.items)) {
      state.activities = actData.items;
    } else {
      console.warn("Activities API returned unexpected shape or no items.");
    }

    // 2. Fetch Reports
    const repRes = await fetch(`${API_BASE}/api/reports/wins-losses?month=${month}&ownerUserId=${currentUserId}`);
    const repData = await repRes.json();
    console.log("Reports API Response:", repData);
    apiReportData = repData;

  } catch (err) {
    console.error("Failed to fetch data from API:", err);
  }

  renderDashboardCards();
  renderActivitiesTables();
  renderWinsTable();
  renderAdminUsersTable();
}

function setup() {
  const form = document.getElementById("activityForm");
  document.getElementById("currentUserLabel").textContent = userName(currentUserId);

  fillSelect(document.getElementById("activityTypeInput"), ACTIVITY_TYPES, false);
  fillSelect(document.getElementById("callTypeInput"), CALL_TYPES, true, "N/A");
  fillSelect(form.elements.industryId, INDUSTRIES, true, "Select");
  fillSelect(form.elements.useCaseIds, USE_CASES, false);
  fillSelect(form.elements.channelIds, CHANNELS, false);
  fillSelect(form.elements.productIds, PRODUCTS, false);
  form.elements.coParticipants.innerHTML = state.users
    .filter((u) => u.id !== currentUserId)
    .map((u) => `<option value="${u.id}">${u.name}</option>`)
    .join("");

  document.getElementById("prevMonthBtn").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("nextMonthBtn").addEventListener("click", () => shiftMonth(1));
  document.querySelectorAll(".nav-item[data-nav-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextView = btn.dataset.navView;
      if (nextView === "activitiesView") activityViewMode = "all";
      setView(nextView);
      refresh().catch(console.error);
    });
  });

  document.addEventListener("click", (e) => {
    const navCard = e.target.closest(".dashboard-card[data-target]");
    if (navCard) {
      if (navCard.dataset.target === "activitiesView") {
        activityViewMode = navCard.dataset.mode === "pending" ? "pending" : "all";
      }
      setView(navCard.dataset.target);
      refresh();
      return;
    }
    const btn = e.target.closest("button[data-action][data-id]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const row = state.activities.find((a) => a.id === id);
    if (!row) return;
    if (action === "edit") {
      editingActivityId = id;
      setModalMode(true);
      populateForm(row);
      openModal();
      return;
    }
    if (action === "commit") {
      const newStatus = row.commitStatus === "committed" ? "not_committed" : "committed";
      fetch(`${API_BASE}/api/activities/${id}/commit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitStatus: newStatus })
      })
        .then(() => refresh())
        .catch(console.error);
      return;
    }
    if (action === "reject") {
      if (window.confirm("Reject this record? It will be archived from active view.")) {
        fetch(`${API_BASE}/api/activities/${id}/reject`, { method: "POST" })
          .then(() => refresh())
          .catch(console.error);
      }
      return;
    }
    if (action === "delete") {
      if (window.confirm("Delete this record permanently?")) {
        fetch(`${API_BASE}/api/activities/${id}`, { method: "DELETE" })
          .then(() => refresh())
          .catch(console.error);
      }
      return;
    }
    if (action === "reset-pass") {
      if (window.confirm(`Reset password for ${userName(id)} to default?`)) {
        fetch(`${API_BASE}/api/admin/users/${id}/reset-password`, { method: "POST" })
          .then(r => r.json())
          .then(data => alert(data.message || "Password reset."))
          .catch(console.error);
      }
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("presight-session-token");
    localStorage.removeItem("presight-session-user");
    location.reload();
  });

  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const msg = document.getElementById("loginMessage");
    msg.classList.add("hidden");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.error || "Login failed";
        msg.classList.remove("hidden");
        return;
      }
      sessionToken = data.token;
      sessionUser = data.user;
      localStorage.setItem("presight-session-token", sessionToken);
      localStorage.setItem("presight-session-user", JSON.stringify(sessionUser));
      document.getElementById("loginOverlay").classList.add("hidden");
      refresh();
    } catch {
      msg.textContent = "Network error during login.";
      msg.classList.remove("hidden");
    }
  });

  const resetForm = document.getElementById("passwordResetForm");
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPass = document.getElementById("resetNewPassword").value;
    const confirmPass = document.getElementById("resetConfirmPassword").value;
    const msg = document.getElementById("resetMessage");
    msg.classList.add("hidden");

    if (newPass !== confirmPass) {
      msg.textContent = "Passwords do not match.";
      msg.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionUser.userId, newPassword: newPass })
      });
      if (!res.ok) {
        const data = await res.json();
        msg.textContent = data.error || "Reset failed";
        msg.classList.remove("hidden");
        return;
      }
      sessionUser.needsPasswordReset = false;
      localStorage.setItem("presight-session-user", JSON.stringify(sessionUser));
      document.getElementById("passwordResetOverlay").classList.add("hidden");
      refresh();
    } catch {
      msg.textContent = "Network error during reset.";
      msg.classList.remove("hidden");
    }
  });

  document.getElementById("bulkCommitBtn").addEventListener("click", () => {
    if (window.confirm("Commit all pending activities for this month?")) {
      fetch(`${API_BASE}/api/activities/bulk-commit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth(), ownerUserId: currentUserId })
      })
        .then(() => refresh())
        .catch(console.error);
    }
  });

  document.getElementById("openLogModalBtn").addEventListener("click", () => {
    editingActivityId = null;
    setModalMode(false);
    applyDefaults(form);
    openModal();
  });
  document.getElementById("closeLogModalBtn").addEventListener("click", closeModal);
  document.getElementById("cancelLogModalBtn").addEventListener("click", closeModal);
  document.getElementById("logModalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "logModalBackdrop") closeModal();
  });
  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    localStorage.removeItem("phase1-presales-impact");
    state = structuredClone(seed);
    persist();
    location.reload();
  });

  const adminUserForm = document.getElementById("adminUserForm");
  const adminUserMessage = document.getElementById("adminUserMessage");
  adminUserForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    adminUserMessage.textContent = "";
    const payload = {
      displayName: document.getElementById("adminUserName").value.trim(),
      email: document.getElementById("adminUserEmail").value.trim().toLowerCase()
    };
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        adminUserMessage.textContent = data.error || "Failed to add user.";
        return;
      }
      const normalized = normalizeUsers([data.user])[0];
      if (!state.users.some((u) => u.id === normalized.id)) {
        state.users.push(normalized);
        persist();
      }
      adminUserForm.reset();
      adminUserMessage.textContent = `Added user ${normalized.name} (${normalized.email}).`;
      refresh();
    } catch {
      adminUserMessage.textContent = "Network error while adding user.";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      id: editingActivityId || crypto.randomUUID(),
      meetingKey: (data.get("meetingKey") || "").trim() || `${data.get("date")}|${data.get("accountName")}|${data.get("activityTypeId")}`,
      date: data.get("date"),
      ownerUserId: currentUserId,
      sourceType: data.get("sourceType"),
      category: data.get("category"),
      activityTypeId: data.get("activityTypeId"),
      callTypeId: data.get("callTypeId"),
      joinedCall: data.get("joinedCall"),
      participationRole: data.get("participationRole"),
      coParticipants: getMulti(form.elements.coParticipants),
      accountName: data.get("accountName"),
      industryId: data.get("industryId"),
      useCaseIds: getMulti(form.elements.useCaseIds),
      channelIds: getMulti(form.elements.channelIds),
      productIds: getMulti(form.elements.productIds),
      valueDerived: data.get("valueDerived"),
      evidenceAvailable: data.get("evidenceAvailable"),
      linkedSourceCount: Number(data.get("linkedSourceCount") || 0),
      summary: data.get("summary"),
      nextSteps: data.get("nextSteps"),
      sfdcOpportunityId: data.get("sfdcOpportunityId"),
      sfdcOpportunityLink: data.get("sfdcOpportunityLink"),
      sfdcPresalesRepName: data.get("sfdcPresalesRepName"),
      crmLinkStatus: data.get("crmLinkStatus"),
      dealOutcome: data.get("dealOutcome"),
      sowLinked: data.get("sowLinked") === "true",
      customerEmailsSent: Number(data.get("customerEmailsSent") || 0),
      tagInternalToAccount: form.elements.tagInternalToAccount.checked,
      commitStatus: data.get("commitStatus"),
      recordStatus: "active"
    };
    enforceLeadRule(payload);
    const idx = state.activities.findIndex((a) => a.id === payload.id);
    const method = idx >= 0 ? "PATCH" : "POST";
    const url = idx >= 0 ? `${API_BASE}/api/activities/${payload.id}` : `${API_BASE}/api/activities`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then(() => {
        state.defaults = {
          category: payload.category,
          activityTypeId: payload.activityTypeId,
          callTypeId: payload.callTypeId,
          sourceType: payload.sourceType,
          commitStatus: payload.commitStatus
        };
        editingActivityId = null;
        closeModal();
        refresh().catch(console.error);
        setView("activitiesView");
      })
      .catch(console.error);
  });

  applyDefaults(form);
  fetch(`${API_BASE}/api/config/taxonomies`)
    .then((r) => r.json())
    .then((cfg) => {
      // 1. Update labelMap from fetched taxonomies
      if (cfg?.taxonomies) {
        const tx = cfg.taxonomies;
        const allItems = [
          ...(tx.activityTypes || []),
          ...(tx.callTypes || []),
          ...(tx.industries || []),
          ...(tx.useCases || []),
          ...(tx.channels || []),
          ...(tx.products || [])
        ];
        allItems.forEach((item) => {
          labelMap[item.id] = item.label;
        });
      }

      // 2. Update users
      const liveUsers = normalizeUsers(cfg?.users);
      if (liveUsers.length) {
        state.users = liveUsers;
        persist();
        document.getElementById("currentUserLabel").textContent = userName(currentUserId);
        form.elements.coParticipants.innerHTML = state.users
          .filter((u) => u.id !== currentUserId)
          .map((u) => `<option value="${u.id}">${u.name}</option>`)
          .join("");
      }
      refresh().catch(console.error);
    })
    .catch(() => refresh().catch(console.error));
  setView("dashboardView");
}

setup();
