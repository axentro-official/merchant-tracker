const API_URL =
  "https://script.google.com/macros/s/AKfycbyjqBufHSA2rybb82-B1ua5-h4GAsL4Qt42KcOxlL6S2Bin0CE0rlFWsG1KpXuZRNw7/exec";

const SESSION_KEY = "merchant_tracker_logged_in";

const state = {
  merchants: [],
  machines: [],
  transfers: [],
  collections: [],
  dashboard: null,
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  boot();
});

function bindEvents() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("logout-btn").addEventListener("click", logout);

  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchSection(btn.dataset.view, btn.textContent.trim(), btn));
  });

  document.getElementById("refresh-dashboard-btn").addEventListener("click", loadAllData);

  document.getElementById("merchant-form").addEventListener("submit", submitMerchantForm);
  document.getElementById("merchant-reset-btn").addEventListener("click", resetMerchantForm);
  document.getElementById("load-merchants-btn").addEventListener("click", loadMerchants);

  document.getElementById("machine-form").addEventListener("submit", submitMachineForm);
  document.getElementById("machine-reset-btn").addEventListener("click", resetMachineForm);
  document.getElementById("load-machines-btn").addEventListener("click", loadMachines);

  document.getElementById("transfer-form").addEventListener("submit", submitTransferForm);
  document.getElementById("load-transfers-btn").addEventListener("click", loadTransfers);

  document.getElementById("collection-form").addEventListener("submit", submitCollectionForm);
  document.getElementById("load-collections-btn").addEventListener("click", loadCollections);

  document.getElementById("statement-form").addEventListener("submit", submitStatementForm);
  document.getElementById("close-month-form").addEventListener("submit", submitCloseMonthForm);

  document.getElementById("transfer-merchant-id").addEventListener("change", syncMachineOptionsForTransfer);
  document.getElementById("collection-merchant-id").addEventListener("change", syncMachineOptionsForCollection);
}

function boot() {
  const loggedIn = localStorage.getItem(SESSION_KEY) === "true";

  if (loggedIn) {
    showDashboard();
    loadAllData();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("login-view").classList.remove("hidden");
  document.getElementById("dashboard-view").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");
}

async function callApi(action, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action, data }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "حدث خطأ أثناء الاتصال بالخدمة");
  }

  return result;
}

async function handleLogin(e) {
  e.preventDefault();

  const password = document.getElementById("password").value.trim();

  try {
    await callApi("login", { password });
    localStorage.setItem(SESSION_KEY, "true");
    showToast("تم تسجيل الدخول بنجاح", "success");
    showDashboard();
    await loadAllData();
    document.getElementById("password").value = "";
  } catch (error) {
    showToast(error.message, "error");
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  showLogin();
}

async function loadAllData() {
  await Promise.all([
    loadDashboard(),
    loadMerchants(),
    loadMachines(),
    loadTransfers(),
    loadCollections(),
  ]);

  fillMerchantSelects();
  document.getElementById("close-month-key").value =
    state.dashboard?.["الشهر الحالي"] || "";
}

async function loadDashboard() {
  try {
    const result = await callApi("getDashboard");
    state.dashboard = result.data;

    document.getElementById("current-month-label").textContent =
      `الشهر الحالي: ${state.dashboard["الشهر الحالي"] || "--"}`;

    document.getElementById("stat-transfers").textContent = formatNumber(state.dashboard["إجمالي التحويلات"]);
    document.getElementById("stat-collections").textContent = formatNumber(state.dashboard["إجمالي التحصيلات"]);
    document.getElementById("stat-remaining").textContent = formatNumber(state.dashboard["إجمالي المتبقي"]);
    document.getElementById("stat-merchants").textContent = formatNumber(state.dashboard["عدد التجار"]);
    document.getElementById("stat-machines").textContent = formatNumber(state.dashboard["عدد المكن"]);
    document.getElementById("stat-today").textContent =
      formatNumber((state.dashboard["عدد تحويلات اليوم"] || 0) + (state.dashboard["عدد تحصيلات اليوم"] || 0));

    renderTopDebtors(state.dashboard["أعلى التجار مديونية"] || []);
    renderMachinesPerformance(state.dashboard["أداء المكن"] || []);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadMerchants() {
  try {
    const result = await callApi("getMerchants");
    state.merchants = result.data || [];
    renderMerchants();
    fillMerchantSelects();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadMachines() {
  try {
    const result = await callApi("getMachines");
    state.machines = result.data || [];
    renderMachines();
    syncMachineOptionsForTransfer();
    syncMachineOptionsForCollection();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadTransfers() {
  try {
    const result = await callApi("getTransfers");
    state.transfers = result.data || [];
    renderTransfers();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadCollections() {
  try {
    const result = await callApi("getCollections");
    state.collections = result.data || [];
    renderCollections();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function renderTopDebtors(rows) {
  const tbody = document.getElementById("top-debtors-body");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="3">لا توجد بيانات</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["اسم التاجر"] || "")}</td>
          <td>${escapeHtml(row["رقم الحساب"] || "")}</td>
          <td>${formatNumber(row["المتبقي"] || 0)}</td>
        </tr>
      `
    )
    .join("");
}

function renderMachinesPerformance(rows) {
  const tbody = document.getElementById("machines-performance-body");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">لا توجد بيانات</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["رقم المكنة"] || "")}</td>
          <td>${escapeHtml(row["اسم التاجر"] || "")}</td>
          <td>${formatNumber(row["التارجت الشهري"] || 0)}</td>
          <td>${formatNumber(row["الفعلي"] || 0)}</td>
          <td>${formatNumber(row["نسبة الإنجاز"] || 0)}%</td>
        </tr>
      `
    )
    .join("");
}

function renderMerchants() {
  const tbody = document.getElementById("merchants-body");
  tbody.innerHTML = "";

  if (!state.merchants.length) {
    tbody.innerHTML = `<tr><td colspan="6">لا يوجد تجار حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = state.merchants
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["رقم التاجر"] || "")}</td>
          <td>${escapeHtml(row["اسم التاجر"] || "")}</td>
          <td>${escapeHtml(row["اسم النشاط"] || "")}</td>
          <td>${escapeHtml(row["رقم الحساب"] || "")}</td>
          <td>${escapeHtml(row["الحالة"] || "")}</td>
          <td>
            <div class="action-buttons">
              <button class="edit-btn" onclick="editMerchant('${escapeJs(row["رقم التاجر"])}')">تعديل</button>
              <button class="delete-btn" onclick="deleteMerchant('${escapeJs(row["رقم التاجر"])}')">حذف</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderMachines() {
  const tbody = document.getElementById("machines-body");
  tbody.innerHTML = "";

  if (!state.machines.length) {
    tbody.innerHTML = `<tr><td colspan="6">لا يوجد مكن حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = state.machines
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["رقم المكنة"] || "")}</td>
          <td>${escapeHtml(row["اسم التاجر"] || "")}</td>
          <td>${escapeHtml(row["الباركود"] || "")}</td>
          <td>${formatNumber(row["التارجت الشهري"] || 0)}</td>
          <td>${escapeHtml(row["الحالة"] || "")}</td>
          <td>
            <div class="action-buttons">
              <button class="edit-btn" onclick="editMachine('${escapeJs(row["رقم المكنة"])}')">تعديل</button>
              <button class="delete-btn" onclick="deleteMachine('${escapeJs(row["رقم المكنة"])}')">حذف</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderTransfers() {
  const tbody = document.getElementById("transfers-body");
  tbody.innerHTML = "";

  if (!state.transfers.length) {
    tbody.innerHTML = `<tr><td colspan="7">لا توجد تحويلات</td></tr>`;
    return;
  }

  tbody.innerHTML = state.transfers
    .slice()
    .reverse()
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["رقم التحويل"] || "")}</td>
          <td>${escapeHtml(row["الرقم المرجعي"] || "")}</td>
          <td>${escapeHtml(row["اسم التاجر"] || "")}</td>
          <td>${escapeHtml(row["رقم المكنة"] || "")}</td>
          <td>${formatNumber(row["قيمة التحويل"] || 0)}</td>
          <td>${escapeHtml(row["التاريخ"] || "")}</td>
          <td>
            <div class="action-buttons">
              <button class="delete-btn" onclick="deleteTransfer('${escapeJs(row["رقم التحويل"])}')">حذف</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderCollections() {
  const tbody = document.getElementById("collections-body");
  tbody.innerHTML = "";

  if (!state.collections.length) {
    tbody.innerHTML = `<tr><td colspan="7">لا توجد تحصيلات</td></tr>`;
    return;
  }

  tbody.innerHTML = state.collections
    .slice()
    .reverse()
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["رقم التحصيل"] || "")}</td>
          <td>${escapeHtml(row["الرقم المرجعي"] || "")}</td>
          <td>${escapeHtml(row["اسم التاجر"] || "")}</td>
          <td>${escapeHtml(row["رقم المكنة"] || "")}</td>
          <td>${formatNumber(row["قيمة التحصيل"] || 0)}</td>
          <td>${escapeHtml(row["نوع التحصيل"] || "")}</td>
          <td>
            <div class="action-buttons">
              <button class="delete-btn" onclick="deleteCollection('${escapeJs(row["رقم التحصيل"])}')">حذف</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function submitMerchantForm(e) {
  e.preventDefault();

  const merchantId = document.getElementById("merchant-id").value.trim();
  const payload = {
    merchantId,
    merchantName: document.getElementById("merchant-name").value.trim(),
    businessName: document.getElementById("business-name").value.trim(),
    accountNumber: document.getElementById("account-number").value.trim(),
    phone: document.getElementById("merchant-phone").value.trim(),
    area: document.getElementById("merchant-area").value.trim(),
    address: document.getElementById("merchant-address").value.trim(),
    status: document.getElementById("merchant-status").value,
    notes: document.getElementById("merchant-notes").value.trim(),
  };

  try {
    if (merchantId) {
      await callApi("updateMerchant", payload);
      showToast("تم تعديل التاجر بنجاح", "success");
    } else {
      await callApi("addMerchant", payload);
      showToast("تمت إضافة التاجر بنجاح", "success");
    }

    resetMerchantForm();
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function resetMerchantForm() {
  document.getElementById("merchant-form").reset();
  document.getElementById("merchant-id").value = "";
  document.getElementById("merchant-status").value = "نشط";
}

function editMerchant(merchantId) {
  const merchant = state.merchants.find((m) => m["رقم التاجر"] === merchantId);
  if (!merchant) return;

  document.getElementById("merchant-id").value = merchant["رقم التاجر"] || "";
  document.getElementById("merchant-name").value = merchant["اسم التاجر"] || "";
  document.getElementById("business-name").value = merchant["اسم النشاط"] || "";
  document.getElementById("account-number").value = merchant["رقم الحساب"] || "";
  document.getElementById("merchant-phone").value = merchant["رقم الهاتف"] || "";
  document.getElementById("merchant-area").value = merchant["المنطقة"] || "";
  document.getElementById("merchant-address").value = merchant["العنوان"] || "";
  document.getElementById("merchant-status").value = merchant["الحالة"] || "نشط";
  document.getElementById("merchant-notes").value = merchant["ملاحظات"] || "";

  switchSection("merchants-section", "التجار", document.querySelector('[data-view="merchants-section"]'));
}

async function deleteMerchant(merchantId) {
  if (!confirm("هل أنت متأكد من حذف هذا التاجر؟")) return;

  try {
    await callApi("deleteMerchant", { merchantId });
    showToast("تم حذف التاجر بنجاح", "success");
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitMachineForm(e) {
  e.preventDefault();

  const machineId = document.getElementById("machine-id").value.trim();
  const payload = {
    machineId,
    merchantId: document.getElementById("machine-merchant-id").value,
    barcode: document.getElementById("machine-barcode").value.trim(),
    serialNumber: document.getElementById("machine-serial").value.trim(),
    monthlyTarget: Number(document.getElementById("machine-target").value || 0),
    status: document.getElementById("machine-status").value,
    notes: document.getElementById("machine-notes").value.trim(),
  };

  try {
    if (machineId) {
      await callApi("updateMachine", payload);
      showToast("تم تعديل المكنة بنجاح", "success");
    } else {
      await callApi("addMachine", payload);
      showToast("تمت إضافة المكنة بنجاح", "success");
    }

    resetMachineForm();
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function resetMachineForm() {
  document.getElementById("machine-form").reset();
  document.getElementById("machine-id").value = "";
  document.getElementById("machine-status").value = "نشطة";
  document.getElementById("machine-target").value = "0";
}

function editMachine(machineId) {
  const machine = state.machines.find((m) => m["رقم المكنة"] === machineId);
  if (!machine) return;

  document.getElementById("machine-id").value = machine["رقم المكنة"] || "";
  document.getElementById("machine-merchant-id").value = machine["رقم التاجر"] || "";
  document.getElementById("machine-barcode").value = machine["الباركود"] || "";
  document.getElementById("machine-serial").value = machine["الرقم التسلسلي"] || "";
  document.getElementById("machine-target").value = machine["التارجت الشهري"] || 0;
  document.getElementById("machine-status").value = machine["الحالة"] || "نشطة";
  document.getElementById("machine-notes").value = machine["ملاحظات"] || "";

  switchSection("machines-section", "المكن", document.querySelector('[data-view="machines-section"]'));
}

async function deleteMachine(machineId) {
  if (!confirm("هل أنت متأكد من حذف هذه المكنة؟")) return;

  try {
    await callApi("deleteMachine", { machineId });
    showToast("تم حذف المكنة بنجاح", "success");
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitTransferForm(e) {
  e.preventDefault();

  const payload = {
    merchantId: document.getElementById("transfer-merchant-id").value,
    machineId: document.getElementById("transfer-machine-id").value,
    amount: Number(document.getElementById("transfer-amount").value || 0),
    notes: document.getElementById("transfer-notes").value.trim(),
  };

  try {
    await callApi("addTransfer", payload);
    showToast("تم تسجيل التحويل بنجاح", "success");
    document.getElementById("transfer-form").reset();
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteTransfer(transferId) {
  if (!confirm("هل أنت متأكد من حذف هذا التحويل؟")) return;

  try {
    await callApi("deleteTransfer", { transferId });
    showToast("تم حذف التحويل بنجاح", "success");
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitCollectionForm(e) {
  e.preventDefault();

  const payload = {
    merchantId: document.getElementById("collection-merchant-id").value,
    machineId: document.getElementById("collection-machine-id").value,
    amount: Number(document.getElementById("collection-amount").value || 0),
    collectionType: document.getElementById("collection-type").value,
    notes: document.getElementById("collection-notes").value.trim(),
  };

  try {
    await callApi("addCollection", payload);
    showToast("تم تسجيل التحصيل بنجاح", "success");
    document.getElementById("collection-form").reset();
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteCollection(collectionId) {
  if (!confirm("هل أنت متأكد من حذف هذا التحصيل؟")) return;

  try {
    await callApi("deleteCollection", { collectionId });
    showToast("تم حذف التحصيل بنجاح", "success");
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitStatementForm(e) {
  e.preventDefault();

  const merchantId = document.getElementById("statement-merchant-id").value;

  try {
    const result = await callApi("getMerchantStatement", { merchantId });
    const data = result.data;

    document.getElementById("statement-summary").classList.remove("hidden");
    document.getElementById("statement-total-transfers").textContent = formatNumber(data["إجمالي التحويلات"] || 0);
    document.getElementById("statement-total-collections").textContent = formatNumber(data["إجمالي التحصيلات"] || 0);
    document.getElementById("statement-remaining").textContent = formatNumber(data["المتبقي الحالي"] || 0);
    document.getElementById("statement-movements-count").textContent = formatNumber(data["عدد الحركات"] || 0);

    const tbody = document.getElementById("statement-body");
    const movements = data["الحركات"] || [];

    if (!movements.length) {
      tbody.innerHTML = `<tr><td colspan="7">لا توجد حركات لهذا التاجر</td></tr>`;
      return;
    }

    tbody.innerHTML = movements
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row["النوع"] || "")}</td>
            <td>${escapeHtml(row["الرقم"] || "")}</td>
            <td>${escapeHtml(row["الرقم المرجعي"] || "")}</td>
            <td>${escapeHtml(row["التاريخ"] || "")}</td>
            <td>${escapeHtml(row["الوقت"] || "")}</td>
            <td>${formatNumber(row["القيمة"] || 0)}</td>
            <td>${escapeHtml(row["ملاحظات"] || "")}</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitCloseMonthForm(e) {
  e.preventDefault();

  const monthKey = document.getElementById("close-month-key").value.trim();
  const notes = document.getElementById("close-month-notes").value.trim();

  if (!confirm(`هل أنت متأكد من إغلاق الشهر ${monthKey}؟`)) return;

  try {
    await callApi("closeMonth", { monthKey, notes });
    showToast("تم إغلاق الشهر بنجاح", "success");
    document.getElementById("close-month-form").reset();
    await loadAllData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function fillMerchantSelects() {
  const selects = [
    document.getElementById("machine-merchant-id"),
    document.getElementById("transfer-merchant-id"),
    document.getElementById("collection-merchant-id"),
    document.getElementById("statement-merchant-id"),
  ];

  const options = `<option value="">اختر التاجر</option>` +
    state.merchants
      .map(
        (m) =>
          `<option value="${escapeHtml(m["رقم التاجر"] || "")}">${escapeHtml(
            (m["اسم التاجر"] || "") + " - " + (m["رقم الحساب"] || "")
          )}</option>`
      )
      .join("");

  selects.forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = options;
    if ([...select.options].some((o) => o.value === currentValue)) {
      select.value = currentValue;
    }
  });

  syncMachineOptionsForTransfer();
  syncMachineOptionsForCollection();
}

function syncMachineOptionsForTransfer() {
  fillMachineSelectByMerchant("transfer-merchant-id", "transfer-machine-id");
}

function syncMachineOptionsForCollection() {
  fillMachineSelectByMerchant("collection-merchant-id", "collection-machine-id");
}

function fillMachineSelectByMerchant(merchantSelectId, machineSelectId) {
  const merchantId = document.getElementById(merchantSelectId).value;
  const machineSelect = document.getElementById(machineSelectId);

  const filteredMachines = state.machines.filter((m) => m["رقم التاجر"] === merchantId);

  machineSelect.innerHTML =
    `<option value="">اختر المكنة</option>` +
    filteredMachines
      .map(
        (m) =>
          `<option value="${escapeHtml(m["رقم المكنة"] || "")}">${escapeHtml(
            (m["رقم المكنة"] || "") + " - " + (m["الباركود"] || "")
          )}</option>`
      )
      .join("");
}

function switchSection(sectionId, title, clickedBtn) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.add("hidden");
  });

  document.getElementById(sectionId).classList.remove("hidden");
  document.getElementById("page-title").textContent = title;

  document.querySelectorAll(".menu-btn").forEach((btn) => btn.classList.remove("active"));
  if (clickedBtn) clickedBtn.classList.add("active");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ar-EG");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
