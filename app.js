const API_URL = "https://script.google.com/macros/s/AKfycbyjqBufHSA2rybb82-B1ua5-h4GAsL4Qt42KcOxlL6S2Bin0CE0rlFWsG1KpXuZRNw7/exec";
const SESSION_KEY = "merchant_tracker_auth";
const state = { merchants: [], machines: [], transfers: [], collections: [], dashboard: {} };

document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  if (localStorage.getItem(SESSION_KEY) === "true") {
    showApp();
  } else {
    showLogin();
  }
  bindEvents();
}

function bindEvents() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("logout-btn").addEventListener("click", logout);
  
  // Sidebar Navigation
  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => switchSection(btn.dataset.view, btn.textContent.trim(), btn));
  });

  // Actions
  document.getElementById("refresh-dashboard-btn").addEventListener("click", loadAllData);
  document.getElementById("export-workbook-btn").addEventListener("click", exportExcel);
  
  // Forms
  document.getElementById("merchant-form").addEventListener("submit", submitMerchant);
  document.getElementById("machine-form").addEventListener("submit", submitMachine);
  document.getElementById("transfer-form").addEventListener("submit", submitTransfer);
  document.getElementById("collection-form").addEventListener("submit", submitCollection);
  document.getElementById("statement-form").addEventListener("submit", submitStatement);
  document.getElementById("close-month-form").addEventListener("submit", submitCloseMonth);

  // Search
  document.getElementById("merchants-search").addEventListener("input", renderMerchants);
  document.getElementById("machines-search").addEventListener("input", renderMachines);
  
  // Dropdowns
  document.getElementById("transfer-merchant-id").addEventListener("change", () => syncMachines("transfer-merchant-id", "transfer-machine-id"));
  document.getElementById("collection-merchant-id").addEventListener("change", () => syncMachines("collection-merchant-id", "collection-machine-id"));
}

function showLogin() {
  document.getElementById("login-view").classList.remove("hidden");
  document.getElementById("dashboard-view").classList.add("hidden");
}

function showApp() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");
  loadAllData(); // Load data immediately upon showing app
}

async function api(action, data = {}) {
  showLoader();
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action, data }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Error");
    return json;
  } catch (err) {
    showToast(err.message, "error");
    throw err;
  } finally {
    hideLoader();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const pwd = document.getElementById("password").value;
  try {
    await api("login", { password: pwd });
    localStorage.setItem(SESSION_KEY, "true");
    showApp();
  } catch {}
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  showLogin();
}

async function loadAllData() {
  try {
    const [dash, merch, mach, trans, coll] = await Promise.all([
      api("getDashboard"),
      api("getMerchants"),
      api("getMachines"),
      api("getTransfers"),
      api("getCollections")
    ]);
    
    state.dashboard = dash.data || {};
    state.merchants = merch.data || [];
    state.machines = mach.data || [];
    state.transfers = trans.data || [];
    state.collections = coll.data || [];
    
    updateUI();
    fillDropdowns();
  } catch (e) {
    console.error(e);
  }
}

function updateUI() {
  const d = state.dashboard;
  document.getElementById("current-month-label").textContent = d["الشهر الحالي"] || "--";
  document.getElementById("stat-transfers").textContent = formatNum(d["إجمالي التحويلات"]);
  document.getElementById("stat-collections").textContent = formatNum(d["إجمالي التحصيلات"]);
  document.getElementById("stat-remaining").textContent = formatNum(d["إجمالي المتبقي"]);
  document.getElementById("stat-merchants").textContent = d["عدد التجار"] || 0;
  document.getElementById("stat-machines").textContent = d["عدد المكن"] || 0;
  document.getElementById("stat-today").textContent = (d["عدد تحويلات اليوم"] || 0) + (d["عدد تحصيلات اليوم"] || 0);

  renderMerchants();
  renderMachines();
  renderTransfers();
  renderCollections();
  
  // Top Debtors
  const debtors = d["أعلى التجار مديونية"] || [];
  document.getElementById("top-debtors-body").innerHTML = debtors.map(m => 
    `<tr><td>${m['اسم التاجر']}</td><td>${formatNum(m['المتبقي'])}</td></tr>`
  ).join('') || '<tr><td colspan="2">لا توجد بيانات</td></tr>';
}

// --- Renders ---
function renderMerchants() {
  const q = document.getElementById("merchants-search").value.toLowerCase();
  const rows = state.merchants.filter(m => m['اسم التاجر']?.toLowerCase().includes(q));
  document.getElementById("merchants-body").innerHTML = rows.map(m => `
    <tr>
      <td>${m['اسم التاجر']}</td><td>${m['رقم الحساب']}</td><td>${m['الحالة']}</td>
      <td><button class="action-btn edit-btn" onclick="editMerchant('${m['رقم التاجر']}')">تعديل</button> <button class="action-btn delete-btn" onclick="deleteMerchant('${m['رقم التاجر']}')">حذف</button></td>
    </tr>
  `).join('') || '<tr><td colspan="4">لا يوجد تجار</td></tr>';
}

function renderMachines() {
  const q = document.getElementById("machines-search").value.toLowerCase();
  const rows = state.machines.filter(m => m['الباركود']?.toLowerCase().includes(q) || m['اسم التاجر']?.toLowerCase().includes(q));
  document.getElementById("machines-body").innerHTML = rows.map(m => `
    <tr>
      <td>${m['رقم المكنة']}</td><td>${m['اسم التاجر']}</td><td>${m['الباركود']}</td>
      <td><button class="action-btn delete-btn" onclick="deleteMachine('${m['رقم المكنة']}')">حذف</button></td>
    </tr>
  `).join('') || '<tr><td colspan="4">لا يوجد مكن</td></tr>';
}

function renderTransfers() {
  const rows = state.transfers.slice().reverse();
  document.getElementById("transfers-body").innerHTML = rows.map(t => `
    <tr>
      <td>${t['التاريخ']}</td><td>${t['اسم التاجر']}</td><td>${formatNum(t['قيمة التحويل'])}</td>
      <td><button class="action-btn delete-btn" onclick="deleteTransfer('${t['رقم التحويل']}')">حذف</button></td>
    </tr>
  `).join('') || '<tr><td colspan="4">لا توجد تحويلات</td></tr>';
}

function renderCollections() {
  const rows = state.collections.slice().reverse();
  document.getElementById("collections-body").innerHTML = rows.map(c => `
    <tr>
      <td>${c['التاريخ']}</td><td>${c['اسم التاجر']}</td><td>${formatNum(c['قيمة التحصيل'])}</td>
      <td><button class="action-btn delete-btn" onclick="deleteCollection('${c['رقم التحصيل']}')">حذف</button></td>
    </tr>
  `).join('') || '<tr><td colspan="4">لا توجد تحصيلات</td></tr>';
}

// --- Forms Logic ---
function fillDropdowns() {
  const merchOpts = state.merchants.map(m => `<option value="${m['رقم التاجر']}">${m['اسم التاجر']}</option>`).join('');
  const selectors = ["machine-merchant-id", "transfer-merchant-id", "collection-merchant-id", "statement-merchant-id"];
  selectors.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = `<option value="">اختر...</option>${merchOpts}`;
  });
}

function syncMachines(merchSelectId, machineSelectId) {
  const mid = document.getElementById(merchSelectId).value;
  const filtered = state.machines.filter(m => m['رقم التاجر'] === mid);
  document.getElementById(machineSelectId).innerHTML = `<option value="">اختر...</option>` + 
    filtered.map(m => `<option value="${m['رقم المكنة']}">${m['الباركود']}</option>`).join('');
}

async function submitMerchant(e) {
  e.preventDefault();
  const id = document.getElementById("merchant-id").value;
  const payload = {
    merchantId: id,
    merchantName: document.getElementById("merchant-name").value,
    accountNumber: document.getElementById("account-number").value,
    phone: document.getElementById("merchant-phone").value,
    area: document.getElementById("merchant-area").value
  };
  await api(id ? "updateMerchant" : "addMerchant", payload);
  showToast("تم الحفظ");
  this.reset();
  document.getElementById("merchant-id").value = "";
  loadAllData();
}

function editMerchant(id) {
  const m = state.merchants.find(x => x['رقم التاجر'] === id);
  if(!m) return;
  document.getElementById("merchant-id").value = m['رقم التاجر'];
  document.getElementById("merchant-name").value = m['اسم التاجر'];
  document.getElementById("account-number").value = m['رقم الحساب'];
  document.getElementById("merchant-phone").value = m['رقم الهاتف'];
  document.getElementById("merchant-area").value = m['المنطقة'];
  switchSection("merchants-section", "التجار");
}

async function deleteMerchant(id) { if(confirm("متأكد؟")) { await api("deleteMerchant", {merchantId: id}); showToast("تم الحذف"); loadAllData(); } }

async function submitMachine(e) {
  e.preventDefault();
  await api("addMachine", {
    merchantId: document.getElementById("machine-merchant-id").value,
    barcode: document.getElementById("machine-barcode").value,
    monthlyTarget: document.getElementById("machine-target").value
  });
  showToast("تم إضافة المكنة");
  this.reset();
  loadAllData();
}

async function deleteMachine(id) { if(confirm("متأكد؟")) { await api("deleteMachine", {machineId: id}); showToast("تم الحذف"); loadAllData(); } }

async function submitTransfer(e) {
  e.preventDefault();
  await api("addTransfer", {
    merchantId: document.getElementById("transfer-merchant-id").value,
    machineId: document.getElementById("transfer-machine-id").value,
    amount: document.getElementById("transfer-amount").value
  });
  showToast("تم التحويل");
  this.reset();
  loadAllData();
}

async function deleteTransfer(id) { if(confirm("متأكد؟")) { await api("deleteTransfer", {transferId: id}); showToast("تم الحذف"); loadAllData(); } }

async function submitCollection(e) {
  e.preventDefault();
  await api("addCollection", {
    merchantId: document.getElementById("collection-merchant-id").value,
    machineId: document.getElementById("collection-machine-id").value,
    amount: document.getElementById("collection-amount").value,
    collectionType: document.getElementById("collection-type").value
  });
  showToast("تم التحصيل");
  this.reset();
  loadAllData();
}

async function deleteCollection(id) { if(confirm("متأكد؟")) { await api("deleteCollection", {collectionId: id}); showToast("تم الحذف"); loadAllData(); } }

async function submitStatement(e) {
  e.preventDefault();
  const mid = document.getElementById("statement-merchant-id").value;
  const res = await api("getMerchantStatement", { merchantId: mid });
  const data = res.data;
  document.getElementById("statement-result").classList.remove("hidden");
  document.getElementById("stmt-t").textContent = formatNum(data["إجمالي التحويلات"]);
  document.getElementById("stmt-c").textContent = formatNum(data["إجمالي التحصيلات"]);
  document.getElementById("stmt-r").textContent = formatNum(data["المتبقي الحالي"]);
  
  const tbody = document.getElementById("statement-body");
  tbody.innerHTML = (data["الحركات"] || []).map(m => 
    `<tr><td>${m['النوع']}</td><td>${formatNum(m['القيمة'])}</td><td>${m['التاريخ']}</td></tr>`
  ).join('') || '<tr><td colspan="3">لا توجد حركات</td></tr>';
}

async function submitCloseMonth(e) {
  e.preventDefault();
  if(!confirm("هل تريد إغلاق الشهر؟ لا يمكن التراجع.")) return;
  await api("closeMonth", { notes: document.getElementById("close-month-notes").value });
  showToast("تم إغلاق الشهر");
  loadAllData();
}

function switchSection(id, title, btn) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.getElementById("page-title").textContent = title;
  
  if(btn) {
    document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
}

function switchSectionMobile(id, btn) {
  let targetId = id;
  if(id === 'more-menu') targetId = 'archives-section'; // Default for more button
  
  const map = {
    'home-section': '🏠 الرئيسية',
    'transfers-section': '💸 تحويلات',
    'collections-section': '💰 تحصيلات',
    'merchants-section': '👥 التجار',
    'archives-section': '📦 المزيد'
  };
  
  switchSection(targetId, map[targetId] || 'القائمة', document.querySelector(`.menu-btn[data-view="${targetId}"]`));
  
  document.querySelectorAll(".bottom-nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function exportExcel() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.merchants), "التجار");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.transfers), "التحويلات");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.collections), "التحصيلات");
  XLSX.writeFile(wb, "Axentro_Report.xlsx");
}

// Utils
function showLoader() { document.getElementById("loader").classList.remove("hidden"); }
function hideLoader() { document.getElementById("loader").classList.add("hidden"); }
function showToast(msg, type="success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}
function formatNum(n) { return Number(n || 0).toLocaleString('ar-EG'); }
