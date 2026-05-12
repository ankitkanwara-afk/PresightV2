const currentMonth = new Date().toISOString().slice(0, 7);
const monthDate = (d) => `${currentMonth}-${String(d).padStart(2, "0")}`;
const currentUserId = "u-presales-1";

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

const labelMap = Object.fromEntries([...ACTIVITY_TYPES, ...CALL_TYPES, ...INDUSTRIES, ...USE_CASES, ...CHANNELS, ...PRODUCTS]);

const seed = {
  version: 11,
  users: [
    { id: "u-presales-1", name: "Ankit K", role: "presales" },
    { id: "u-presales-2", name: "Yashah S", role: "presales" },
    { id: "u-presales-3", name: "Ravi S", role: "presales" }
  ],
  defaults: {
    category: "external",
    activityTypeId: "at_customer_call",
    callTypeId: "ct_discovery",
    sourceType: "superagent",
    commitStatus: "not_committed"
  },
  activities: [
    {
      id: crypto.randomUUID(),
      meetingKey: "evt-acme-2026-05-02",
      date: monthDate(2),
      ownerUserId: "u-presales-1",
      sourceType: "superagent",
      category: "external",
      activityTypeId: "at_customer_call",
      callTypeId: "ct_demo",
      joinedCall: "yes",
      participationRole: "lead",
      coParticipants: ["u-presales-2"],
      accountName: "Acme Corp",
      industryId: "ind_bfsi",
      useCaseIds: ["uc_support_automation", "uc_sales_assist"],
      channelIds: ["ch_voice", "ch_web_chat"],
      productIds: ["prd_ai_agents", "prd_voice_ai"],
      valueDerived: "Customer aligned on pilot scope and architecture direction.",
      evidenceAvailable: "yes",
      linkedSourceCount: 3,
      summary: "Discussed support workflow and aligned next evaluation step.",
      nextSteps: "Share solution summary by Friday.",
      sfdcOpportunityId: "OPP-10021",
      sfdcOpportunityLink: "https://example.com/opp/10021",
      sfdcPresalesRepName: "Ankit K",
      crmLinkStatus: "opportunity_linked",
      dealOutcome: "win",
      sowLinked: false,
      tagInternalToAccount: false,
      commitStatus: "committed",
      recordStatus: "active"
    },
    {
      id: crypto.randomUUID(),
      meetingKey: "evt-zen-2026-05-08",
      date: monthDate(8),
      ownerUserId: "u-presales-1",
      sourceType: "superagent",
      category: "external",
      activityTypeId: "at_customer_call",
      callTypeId: "ct_discovery",
      joinedCall: "yes",
      participationRole: "lead",
      coParticipants: [],
      accountName: "Zenline Telecom",
      industryId: "ind_telecom",
      useCaseIds: ["uc_marketing_engagement"],
      channelIds: ["ch_whatsapp", "ch_voice"],
      productIds: ["prd_campaign_manager"],
      valueDerived: "Budget and use-case fit validated.",
      evidenceAvailable: "yes",
      linkedSourceCount: 2,
      summary: "Discovery call mapped phased launch and target metrics.",
      nextSteps: "Send solution blueprint.",
      sfdcOpportunityId: "OPP-10200",
      sfdcOpportunityLink: "https://example.com/opp/10200",
      sfdcPresalesRepName: "Ankit K",
      crmLinkStatus: "opportunity_linked",
      dealOutcome: "open",
      sowLinked: false,
      tagInternalToAccount: false,
      commitStatus: "not_committed",
      recordStatus: "active"
    },
    {
      id: crypto.randomUUID(),
      meetingKey: "evt-everon-2026-05-12",
      date: monthDate(12),
      ownerUserId: "u-presales-1",
      sourceType: "manual",
      category: "external",
      activityTypeId: "at_sow",
      callTypeId: "",
      joinedCall: "yes",
      participationRole: "lead",
      coParticipants: ["u-presales-3"],
      accountName: "Everon Fintech",
      industryId: "ind_bfsi",
      useCaseIds: ["uc_customer_service"],
      channelIds: ["ch_web_chat"],
      productIds: ["prd_journey_builder"],
      valueDerived: "SOW scope finalized for legal review.",
      evidenceAvailable: "yes",
      linkedSourceCount: 1,
      summary: "Manual update for SOW workshop conducted onsite.",
      nextSteps: "Submit final draft to procurement.",
      sfdcOpportunityId: "OPP-10301",
      sfdcOpportunityLink: "https://example.com/opp/10301",
      sfdcPresalesRepName: "Ankit K",
      crmLinkStatus: "opportunity_linked",
      dealOutcome: "open",
      sowLinked: true,
      tagInternalToAccount: false,
      commitStatus: "committed",
      recordStatus: "active"
    },
    {
      id: crypto.randomUUID(),
      meetingKey: "evt-bluecart-2026-05-19",
      date: monthDate(19),
      ownerUserId: "u-presales-1",
      sourceType: "manual",
      category: "external",
      activityTypeId: "at_rfx",
      callTypeId: "",
      joinedCall: "yes",
      participationRole: "contributor",
      coParticipants: ["u-presales-2"],
      accountName: "BlueCart Commerce",
      industryId: "ind_retail_ecom",
      useCaseIds: ["uc_commerce_conversational"],
      channelIds: ["ch_web_chat"],
      productIds: ["prd_agent_assist"],
      valueDerived: "RFx response aligned with ROI asks.",
      evidenceAvailable: "no",
      linkedSourceCount: 0,
      summary: "RFx follow-up logged manually after moved meeting.",
      nextSteps: "Reconfirm if meeting happened this week.",
      sfdcOpportunityId: "",
      sfdcOpportunityLink: "",
      sfdcPresalesRepName: "",
      crmLinkStatus: "account_matched_no_opp",
      dealOutcome: "loss",
      sowLinked: false,
      tagInternalToAccount: false,
      commitStatus: "not_committed",
      recordStatus: "active"
    },
    {
      id: crypto.randomUUID(),
      meetingKey: "evt-pricing-2026-05-22",
      date: monthDate(22),
      ownerUserId: "u-presales-1",
      sourceType: "superagent",
      category: "external",
      activityTypeId: "at_pricing",
      callTypeId: "",
      joinedCall: "yes",
      participationRole: "lead",
      coParticipants: [],
      accountName: "Metro Bank",
      industryId: "ind_bfsi",
      useCaseIds: ["uc_sales_assist"],
      channelIds: ["ch_email"],
      productIds: ["prd_ai_agents"],
      valueDerived: "Pricing assumptions confirmed.",
      evidenceAvailable: "yes",
      linkedSourceCount: 1,
      summary: "Commercial pricing workshop with finance and buyer team.",
      nextSteps: "Share final quote sheet.",
      sfdcOpportunityId: "OPP-10422",
      sfdcOpportunityLink: "https://example.com/opp/10422",
      sfdcPresalesRepName: "Ankit K",
      crmLinkStatus: "opportunity_linked",
      dealOutcome: "open",
      sowLinked: false,
      tagInternalToAccount: false,
      commitStatus: "committed",
      recordStatus: "active"
    },
    {
      id: crypto.randomUUID(),
      meetingKey: "evt-int-2026-05-25",
      date: monthDate(25),
      ownerUserId: "u-presales-1",
      sourceType: "manual",
      category: "internal",
      activityTypeId: "at_other",
      callTypeId: "",
      joinedCall: "yes",
      participationRole: "lead",
      coParticipants: ["u-presales-2"],
      accountName: "Everon Fintech",
      industryId: "ind_bfsi",
      useCaseIds: ["uc_internal_enablement"],
      channelIds: ["ch_web_chat"],
      productIds: ["prd_ai_agents"],
      valueDerived: "Internal prep improved quality of external call plan.",
      evidenceAvailable: "yes",
      linkedSourceCount: 1,
      summary: "Internal strategy discussion tied to account approach.",
      nextSteps: "Finalize account battlecard.",
      sfdcOpportunityId: "",
      sfdcOpportunityLink: "",
      sfdcPresalesRepName: "",
      crmLinkStatus: "no_account",
      dealOutcome: "open",
      sowLinked: false,
      tagInternalToAccount: true,
      commitStatus: "not_committed",
      recordStatus: "active"
    }
  ]
};

let state = loadState();
let editingActivityId = null;
let activityViewMode = "all";

function loadState() {
  const raw = localStorage.getItem("phase1-presales-impact");
  if (!raw) return structuredClone(seed);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.version || parsed.version < 11) return structuredClone(seed);
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
  return document.getElementById("monthFilter").value || currentMonth;
}
function userName(id) {
  return state.users.find((u) => u.id === id)?.name || id;
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
  const wins = countWhere(list, (a) => a.crmLinkStatus === "opportunity_linked" && a.dealOutcome === "win");
  const losses = countWhere(list, (a) => a.dealOutcome === "loss");
  const total = wins + losses;
  return { wins, losses, rate: total ? `${Math.round((wins / total) * 100)}%` : "0%" };
}

function setView(viewId) {
  ["dashboardView", "activitiesView", "winsView"].forEach((id) => {
    document.getElementById(id).classList.toggle("hidden", id !== viewId);
    document.getElementById(id).classList.toggle("active-view", id === viewId);
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
      id: "wins",
      title: "SFDC Wins & Losses",
      value: `${wl.wins} Win and ${wl.losses} Loss`,
      note: `Win rate ${wl.rate}`,
      target: "winsView"
    },
    {
      id: "my",
      title: "My Activity",
      value: list.length,
      note: "Open logged activity page",
      target: "activitiesView",
      mode: "all"
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

function renderActivitiesTable() {
  const rows = activitiesForCurrentView().sort((a, b) => (a.date < b.date ? 1 : -1));
  const tbody = document.querySelector("#activityTable tbody");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="12">No records for selected month.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((a) => {
      const role = a.coParticipants?.length ? `${a.participationRole} + ${a.coParticipants.map(userName).join(", ")}` : a.participationRole;
      return `<tr>
        <td>${a.date}</td>
        <td><span class="chip ${a.sourceType === "superagent" ? "ok" : "warn"}">${a.sourceType}</span></td>
        <td>${labelMap[a.activityTypeId] || "-"}</td>
        <td>${labelMap[a.callTypeId] || "-"}</td>
        <td>${a.accountName || "-"}</td>
        <td>${labelMap[a.industryId] || "-"}</td>
        <td>${(a.useCaseIds || []).map((x) => labelMap[x]).filter(Boolean).join(", ") || "-"}</td>
        <td>${(a.productIds || []).map((x) => labelMap[x]).filter(Boolean).join(", ") || "-"}</td>
        <td class="description-cell">${a.summary || "-"}</td>
        <td>${role || "-"}</td>
        <td><span class="chip ${chipClass(a.commitStatus)}">${a.commitStatus}</span></td>
        <td>
          <button class="tiny-btn" data-action="edit" data-id="${a.id}" type="button">Edit</button>
          <button class="tiny-btn" data-action="commit" data-id="${a.id}" type="button">${a.commitStatus === "committed" ? "Uncommit" : "Commit"}</button>
          <button class="tiny-btn secondary-btn" data-action="reject" data-id="${a.id}" type="button">Reject</button>
          <button class="tiny-btn danger-btn" data-action="delete" data-id="${a.id}" type="button">Delete</button>
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
  form.elements.date.value = new Date().toISOString().slice(0, 10);
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
  const monthInput = document.getElementById("monthFilter");
  const [yy, mm] = (monthInput.value || currentMonth).split("-").map(Number);
  const dt = new Date(yy, mm - 1 + direction, 1);
  monthInput.value = dt.toISOString().slice(0, 7);
  refresh();
}

function refresh() {
  const month = selectedMonth();
  const modeLabel = activityViewMode === "pending" ? "Pending Commit" : "All";
  document.getElementById("listTitle").textContent = `My Activities - ${month} (${modeLabel})`;
  renderDashboardCards();
  renderActivitiesTable();
  renderWinsTable();
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

  document.getElementById("monthFilter").value = currentMonth;
  document.getElementById("monthFilter").addEventListener("change", refresh);
  document.getElementById("prevMonthBtn").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("nextMonthBtn").addEventListener("click", () => shiftMonth(1));

  document.getElementById("backToDashboardFromActivities").addEventListener("click", () => {
    activityViewMode = "all";
    setView("dashboardView");
    refresh();
  });
  document.getElementById("backToDashboardFromWins").addEventListener("click", () => setView("dashboardView"));

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
      row.commitStatus = row.commitStatus === "committed" ? "not_committed" : "committed";
      persist();
      refresh();
      return;
    }
    if (action === "reject") {
      if (window.confirm("Reject this record? It will be archived from active view.")) {
        row.recordStatus = "archived";
        persist();
        refresh();
      }
      return;
    }
    if (action === "delete") {
      if (window.confirm("Delete this record permanently?")) {
        state.activities = state.activities.filter((a) => a.id !== id);
        persist();
        refresh();
      }
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
      tagInternalToAccount: form.elements.tagInternalToAccount.checked,
      commitStatus: data.get("commitStatus"),
      recordStatus: "active"
    };
    enforceLeadRule(payload);
    const idx = state.activities.findIndex((a) => a.id === payload.id);
    if (idx >= 0) state.activities[idx] = payload;
    else state.activities.push(payload);
    state.defaults = {
      category: payload.category,
      activityTypeId: payload.activityTypeId,
      callTypeId: payload.callTypeId,
      sourceType: payload.sourceType,
      commitStatus: payload.commitStatus
    };
    editingActivityId = null;
    persist();
    closeModal();
    refresh();
    setView("activitiesView");
  });

  applyDefaults(form);
  refresh();
  setView("dashboardView");
}

setup();
