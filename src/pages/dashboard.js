import { getTodayDate } from '../utils/helpers.js';
import { formatMoney, formatDate, formatTime, escapeHtml } from '../utils/formatters.js';

let supabase = null;
let lastDebtAlertAt = 0;

export function initDashboardPage() {
  supabase = window.supabaseClient;
}

const setText = (id, val) => {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof val === 'number' ? val.toLocaleString('ar-EG') : val;
};

const safeNumber = (v) => Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0;

const buildDateTime = (d, t) => {
  try {
    return new Date(`${d || ''} ${t || '12:00 AM'}`).getTime() || 0;
  } catch {
    return 0;
  }
};

function relatedToMerchant(row, merchant) {
  return String(row['رقم التاجر'] || '') === String(merchant.id || '')
    || String(row['رقم التاجر'] || '') === String(merchant['رقم التاجر'] || '')
    || String(row['رقم الحساب'] || '') === String(merchant['رقم الحساب'] || '')
    || String(row['اسم التاجر'] || '') === String(merchant['اسم التاجر'] || '');
}

function updateDebtVisual(totalRemaining) {
  const card = document.getElementById('totalRemaining')?.closest('.stat-card');
  if (!card) return;
  card.classList.remove('debt-warning', 'debt-danger');
  const runtimeSettings = window.getRuntimeSettings?.() || {};
  const warningLimit = parseFloat(runtimeSettings.debt_warning) || 15000;
  const dangerLimit = parseFloat(runtimeSettings.debt_danger) || 50000;
  if (totalRemaining >= dangerLimit) card.classList.add('debt-danger');
  else if (totalRemaining >= warningLimit) card.classList.add('debt-warning');

  const now = Date.now();
  const dangerToastLimit = parseFloat((window.getRuntimeSettings?.() || {}).debt_danger) || 50000;
  if (totalRemaining >= dangerToastLimit && now - lastDebtAlertAt > 60000) {
    lastDebtAlertAt = now;
    window.showToast?.(`تنبيه: إجمالي المتبقي مرتفع (${formatMoney(totalRemaining)})`, 'warning');
  }
}

export async function loadDashboardStats() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const today = getTodayDate();
    const [merchantsRes, machinesRes, transfersRes, collectionsRes] = await Promise.all([
      supabase.from('merchants').select('*'),
      supabase.from('machines').select('*'),
      supabase.from('transfers').select('*'),
      supabase.from('collections').select('*')
    ]);

    if (merchantsRes.error) throw merchantsRes.error;
    if (machinesRes.error) throw machinesRes.error;
    if (transfersRes.error) throw transfersRes.error;
    if (collectionsRes.error) throw collectionsRes.error;

    const merchants = merchantsRes.data || [];
    const machines = machinesRes.data || [];
    const transfers = transfersRes.data || [];
    const collections = collectionsRes.data || [];

    setText('totalMerchants', merchants.length);
    setText('totalMachines', machines.length);

    const totalTransfers = transfers.reduce((s, r) => s + safeNumber(r['قيمة التحويل']), 0);
    const totalCollections = collections.reduce((s, r) => s + safeNumber(r['قيمة التحصيل']), 0);
    const todayTransfers = transfers.filter(r => r['التاريخ'] === today).reduce((s, r) => s + safeNumber(r['قيمة التحويل']), 0);
    const totalRemaining = Math.max(0, totalTransfers - totalCollections);

    setText('totalTransfers', totalTransfers);
    setText('totalCollections', totalCollections);
    setText('todayTransfers', todayTransfers);
    setText('totalRemaining', totalRemaining);
    updateDebtVisual(totalRemaining);
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
  }
}

export async function loadRecentActivities() {
  supabase = supabase || window.supabaseClient;
  const tbody = document.getElementById('recentActivityBody');
  if (!supabase || !tbody) return;

  tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري تحميل البيانات...</td></tr>';

  try {
    const [tRes, cRes] = await Promise.all([
      supabase.from('transfers').select('*'),
      supabase.from('collections').select('*')
    ]);

    if (tRes.error) throw tRes.error;
    if (cRes.error) throw cRes.error;

    const rows = [
      ...(tRes.data || []).map(r => ({
        ref: r['الرقم المرجعي'] || '-',
        type: 'تحويل',
        merchant: r['اسم التاجر'] || '-',
        activity: r['اسم النشاط'] || '-',
        amount: safeNumber(r['قيمة التحويل']),
        date: r['التاريخ'] || '',
        time: r['الوقت'] || '',
        status: 'مكتمل',
        sortKey: buildDateTime(r['التاريخ'], r['الوقت'])
      })),
      ...(cRes.data || []).map(r => ({
        ref: r['الرقم المرجعي'] || '-',
        type: 'تحصيل',
        merchant: r['اسم التاجر'] || '-',
        activity: r['اسم النشاط'] || '-',
        amount: safeNumber(r['قيمة التحصيل']),
        date: r['التاريخ'] || '',
        time: r['الوقت'] || '',
        status: 'مكتمل',
        sortKey: buildDateTime(r['التاريخ'], r['الوقت'])
      }))
    ].sort((a, b) => b.sortKey - a.sortKey).slice(0, 10);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i> لا توجد عمليات حديثة</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((r, i) => `<tr><td>${i + 1}</td><td><code class="ref-code">${escapeHtml(r.ref)}</code></td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.merchant)}</td><td>${escapeHtml(r.activity)}</td><td>${formatMoney(r.amount)}</td><td>${formatDate(r.date)}</td><td>${formatTime(r.time)}</td><td><span class="badge badge-success">${escapeHtml(r.status)}</span></td></tr>`).join('');
  } catch (error) {
    console.error('Recent Activities Error:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-exclamation-triangle"></i> حدث خطأ أثناء تحميل آخر العمليات</td></tr>';
  }
}

export async function loadTopMachines() {
  supabase = supabase || window.supabaseClient;
  const tbody = document.getElementById('topMachinesBody');
  if (!supabase || !tbody) return;

  tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري تحميل البيانات...</td></tr>';

  try {
    const [machinesRes, transfersRes, merchantsRes] = await Promise.all([
      supabase.from('machines').select('*'),
      supabase.from('transfers').select('*'),
      supabase.from('merchants').select('*')
    ]);

    if (machinesRes.error) throw machinesRes.error;
    if (transfersRes.error) throw transfersRes.error;
    if (merchantsRes.error) throw merchantsRes.error;

    const machines = machinesRes.data || [];
    const transfers = transfersRes.data || [];
    const merchants = merchantsRes.data || [];

    if (!machines.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-desktop"></i> لا توجد مكن مسجلة</td></tr>';
      return;
    }

    const rows = machines.map(machine => {
      const merchant = merchants.find(m => String(m.id) === String(machine['رقم التاجر']) || String(m['رقم التاجر']) === String(machine['رقم التاجر']) || String(m['رقم الحساب']) === String(machine['رقم الحساب']));
      const machineTransfers = transfers.filter(t =>
        (t['رقم المكنة'] && String(t['رقم المكنة']) === String(machine['رقم المكنة']))
        || (!t['رقم المكنة'] && merchant && relatedToMerchant(t, merchant))
      );
      const achieved = machineTransfers.reduce((s, r) => s + safeNumber(r['قيمة التحويل']), 0);
      const target = safeNumber(machine['التارجت الشهري']);
      const percentage = target > 0 ? (achieved / target) * 100 : 0;
      return {
        merchantCode: merchant?.['رقم التاجر'] || machine['رقم التاجر'] || '-',
        merchantName: machine['اسم التاجر'] || merchant?.['اسم التاجر'] || '-',
        activityName: machine['اسم النشاط'] || merchant?.['اسم النشاط'] || '-',
        machineCode: machine['رقم المكنة'] || '-',
        serial: machine['الرقم التسلسلي'] || '-',
        target,
        achieved,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage || b.achieved - a.achieved).slice(0, 10);

    tbody.innerHTML = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(r.merchantCode)}</td><td>${escapeHtml(r.merchantName)}</td><td>${escapeHtml(r.activityName)}</td><td>${escapeHtml(r.machineCode)}</td><td>${escapeHtml(r.serial)}</td><td>${formatMoney(r.target)}</td><td class="achieved-highlight">${formatMoney(r.achieved)}</td><td><div class="progress-wrapper"><div class="progress-bar-bg"><div class="progress-fill" style="width:${Math.min(r.percentage, 100)}%"></div></div><span class="percentage-text">${r.percentage.toFixed(1)}%</span></div></td></tr>`).join('');
  } catch (error) {
    console.error('Top Machines Error:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-exclamation-triangle"></i> حدث خطأ أثناء تحميل أعلى المكن</td></tr>';
  }
}
