const API = "YOUR_SCRIPT_URL"; // استبدل برابط الكود بتاعك
const state = { data: {} };

document.addEventListener("DOMContentLoaded", init);

function init() {
  if (localStorage.getItem("auth")) runApp();
  else showLogin();
  
  document.getElementById("login-form").addEventListener("submit", login);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("refresh-btn").addEventListener("click", loadAllData);
  document.getElementById("export-btn").addEventListener("click", exportExcel);
  
  // Navigation
  document.querySelectorAll(".nav-btn, .b-nav-btn[data-page]").forEach(btn => {
    btn.addEventListener("click", () => switchPage(btn.dataset.page));
  });
  
  // Forms
  document.getElementById("add-merchant-form").addEventListener("submit", addMerchant);
  document.getElementById("add-machine-form").addEventListener("submit", addMachine);
  document.getElementById("add-transfer-form").addEventListener("submit", addTransfer);
  document.getElementById("add-coll-form").addEventListener("submit", addCollection);
  document.getElementById("stmt-form").addEventListener("submit", getStatement);
  
  // Search
  document.getElementById("search-merchants").addEventListener("input", (e) => renderMerchants(e.target.value));
}

function showLogin() {
  document.getElementById("login-view").classList.remove("hidden");
  document.getElementById("main-view").classList.add("hidden");
  document.getElementById("splash").classList.add("hidden");
}

function runApp() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("main-view").classList.remove("hidden");
  document.getElementById("splash").classList.remove("hidden");
  loadAllData();
}

async function api(action, data = {}) {
  const res = await fetch(API, { method: "POST", body: JSON.stringify({ action, data }) });
  return res.json();
}

async function login(e) {
  e.preventDefault();
  const pwd = document.getElementById("password").value;
  const res = await api("login", { password: pwd });
  if (res.success) {
    localStorage.setItem("auth", "true");
    runApp();
  } else alert("خطأ في كلمة المرور");
}

function logout() {
  localStorage.removeItem("auth");
  location.reload();
}

async function loadAllData() {
  document.getElementById("splash").classList.remove("hidden");
  const res = await api("getAllData");
  state.data = res.data;
  updateUI();
  document.getElementById("splash").classList.add("hidden");
}

function updateUI() {
  const d = state.data.dashboard;
  document.getElementById("stat-transfers").textContent = formatNum(d["إجمالي التحويلات"]);
  document.getElementById("stat-collections").textContent = formatNum(d["إجمالي التحصيلات"]);
  document.getElementById("stat-remaining").textContent = formatNum(d["إجمالي المتبقي"]);
  document.getElementById("stat-merchants").textContent = d["عدد التجار"];
  
  renderTopDebtors(d["أعلى التجار مديونية"]);
  renderMerchants();
  renderMachines();
  renderTransfers();
  renderCollections();
  fillDropdowns();
}

// Renderers
function renderTopDebtors(list) {
  const el = document.getElementById("top-debtors");
  el.innerHTML = list.map(m => `
    <div class="list-item">
      <div class="info"><b>${m['اسم التاجر']}</b><span>مديونية: ${formatNum(m['المتبقي'])}</span></div>
    </div>
  `).join('');
}

function renderMerchants(q = "") {
  const list = state.data.merchants.filter(m => m['اسم التاجر'].includes(q));
  const el = document.getElementById("merchants-list");
  el.innerHTML = list.map(m => `
    <div class="list-item">
      <div class="info"><b>${m['اسم التاجر']}</b><span>${m['رقم الحساب']} | ${m['الحالة']}</span></div>
      <div class="actions">
        <button class="btn-sm btn-danger" onclick="deleteMerch('${m['رقم التاجر']}')">حذف</button>
      </div>
    </div>
  `).join('');
}

function renderMachines() {
  const list = state.data.machines;
  const el = document.getElementById("machines-list");
  el.innerHTML = list.map(m => `
    <div class="list-item">
      <div class="info"><b>${m['الباركود']}</b><span>${m['اسم التاجر']}</span></div>
    </div>
  `).join('');
}

function renderTransfers() {
  const list = state.data.transfers.slice().reverse().slice(0, 20);
  const el = document.getElementById("transfers-list");
  el.innerHTML = list.map(t => `
    <div class="list-item">
      <div class="info"><b>${formatNum(t['قيمة التحويل'])} جنيه</b><span>${t['اسم التاجر']} | ${t['التاريخ']} ${t['الوقت']}</span></div>
    </div>
  `).join('');
}

function renderCollections() {
  const list = state.data.collections.slice().reverse().slice(0, 20);
  const el = document.getElementById("collections-list");
  el.innerHTML = list.map(c => `
    <div class="list-item">
      <div class="info"><b>${formatNum(c['قيمة التحصيل'])} جنيه</b><span>${c['اسم التاجر']} | ${c['التاريخ']} ${c['الوقت']}</span></div>
    </div>
  `).join('');
}

// Fill Dropdowns
function fillDropdowns() {
  const mOpts = state.data.merchants.map(m => `<option value="${m['رقم التاجر']}">${m['اسم التاجر']}</option>`).join('');
  ["mach-merchant", "tr-merchant", "co-merchant", "stmt-merchant"].forEach(id => {
    const sel = document.getElementById(id);
    if(sel) sel.innerHTML = "<option value=''>اختر...</option>" + mOpts;
  });
}

// Sync Machines Dropdown
document.getElementById("tr-merchant")?.addEventListener("change", function() {
  syncMachs(this.value, "tr-machine");
});
document.getElementById("co-merchant")?.addEventListener("change", function() {
  syncMachs(this.value, "co-machine");
});

function syncMachs(mid, targetId) {
  const filtered = state.data.machines.filter(m => m['رقم التاجر'] === mid);
  document.getElementById(targetId).innerHTML = "<option value=''>اختر...</option>" + 
    filtered.map(m => `<option value="${m['رقم المكنة']}">${m['الباركود']}</option>`).join('');
}

// Actions
async function addMerchant(e) {
  e.preventDefault();
  await api("addMerchant", { merchantName: document.getElementById("m-name").value, accountNumber: document.getElementById("m-acc").value, phone: document.getElementById("m-phone").value });
  this.reset();
  loadAllData();
}

async function addMachine(e) {
  e.preventDefault();
  await api("addMachine", { merchantId: document.getElementById("mach-merchant").value, barcode: document.getElementById("mach-barcode").value, monthlyTarget: document.getElementById("mach-target").value });
  this.reset();
  loadAllData();
}

async function addTransfer(e) {
  e.preventDefault();
  await api("addTransfer", { merchantId: document.getElementById("tr-merchant").value, machineId: document.getElementById("tr-machine").value, amount: document.getElementById("tr-amount").value });
  this.reset();
  loadAllData();
}

async function addCollection(e) {
  e.preventDefault();
  await api("addCollection", { merchantId: document.getElementById("co-merchant").value, machineId: document.getElementById("co-machine").value, amount: document.getElementById("co-amount").value, collectionType: document.getElementById("co-type").value });
  this.reset();
  loadAllData();
}

async function getStatement(e) {
  e.preventDefault();
  const mid = document.getElementById("stmt-merchant").value;
  const res = await api("getMerchantStatement", { merchantId: mid });
  document.getElementById("stmt-result").classList.remove("hidden");
  document.getElementById("stmt-t").textContent = formatNum(res.data["إجمالي التحويلات"]);
  document.getElementById("stmt-c").textContent = formatNum(res.data["إجمالي التحصيلات"]);
  document.getElementById("stmt-r").textContent = formatNum(res.data["المتبقي الحالي"]);
  
  const moves = res.data["الحركات"] || [];
  document.getElementById("stmt-moves").innerHTML = moves.map(m => `
    <div class="list-item">
      <div class="info"><b>${m['نوع']} - ${formatNum(m['قيمة'])}</b><span>${m['تاريخ']} ${m['وقت']}</span></div>
    </div>
  `).join('');
}

async function deleteMerch(id) {
  if(confirm("متأكد؟")) {
    await api("deleteMerchant", { merchantId: id });
    loadAllData();
  }
}

function switchPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(`${name}-page`).classList.add("active");
  
  document.querySelectorAll(".nav-btn, .b-nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.nav-btn[data-page="${name}"]`)?.classList.add("active");
  document.querySelector(`.b-nav-btn[data-page="${name}"]`)?.classList.add("active");
}

function showMore() {
  // Simple toggle for extra options or navigate to archives
  switchPage('archives');
}

function exportExcel() {
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(state.data.merchants);
  const ws2 = XLSX.utils.json_to_sheet(state.data.transfers);
  const ws3 = XLSX.utils.json_to_sheet(state.data.collections);
  XLSX.utils.book_append_sheet(wb, ws1, "التجار");
  XLSX.utils.book_append_sheet(wb, ws2, "التحويلات");
  XLSX.utils.book_append_sheet(wb, ws3, "التحصيلات");
  XLSX.writeFile(wb, "Axentro_Report.xlsx");
}

function formatNum(n) { return Number(n || 0).toLocaleString('ar-EG'); }
