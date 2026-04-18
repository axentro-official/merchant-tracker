import { getTodayDate } from '../utils/helpers.js';
import { formatMoney, formatDate, formatTime, escapeHtml } from '../utils/formatters.js';

let supabase = null;

export function initDashboardPage() {
  supabase = window.supabaseClient;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = typeof value === 'number' ? value.toLocaleString('ar-EG') : value;
}

function safeNumber(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function buildDateTime(date, time) {
  if (!date) return 0;
  try {
    const safeTime = time || '12:00 AM';
    return new Date(`${date} ${safeTime}`).getTime();
  } catch {
    return 0;
  }
}

export async function loadDashboardStats() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const today = getTodayDate();

  try {
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

    const totalTransfers = transfers.reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    const totalCollections = collections.reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);

    const todayTransfers = transfers
      .filter(row => row['التاريخ'] === today)
      .reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);

    setText('totalMerchants', merchants.length);
    setText('totalMachines', machines.length);
    setText('totalTransfers', totalTransfers);
    setText('totalCollections', totalCollections);
    setText('todayTransfers', todayTransfers);
    setText('totalRemaining', Math.max(0, totalTransfers - totalCollections));
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
  }
}

export async function loadRecentActivities() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const tbody = document.getElementById('recentActivityBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="empty-state">
        <i class="fas fa-spinner fa-pulse"></i>
        جاري تحميل البيانات...
      </td>
    </tr>
  `;

  try {
    const [transfersRes, collectionsRes] = await Promise.all([
      supabase.from('transfers').select('*'),
      supabase.from('collections').select('*')
    ]);

    if (transfersRes.error) throw transfersRes.error;
    if (collectionsRes.error) throw collectionsRes.error;

    const transfers = (transfersRes.data || []).map(row => ({
      ref: row['الرقم المرجعي'] || '-',
      type: 'تحويل',
      merchantName: row['اسم التاجر'] || '-',
      activityName: row['اسم النشاط'] || '-',
      amount: safeNumber(row['قيمة التحويل']),
      date: row['التاريخ'] || '',
      time: row['الوقت'] || '',
      status: 'مكتمل',
      sortKey: buildDateTime(row['التاريخ'], row['الوقت'])
    }));

    const collections = (collectionsRes.data || []).map(row => ({
      ref: row['الرقم المرجعي'] || '-',
      type: 'تحصيل',
      merchantName: row['اسم التاجر'] || '-',
      activityName: row['اسم النشاط'] || '-',
      amount: safeNumber(row['قيمة التحصيل']),
      date: row['التاريخ'] || '',
      time: row['الوقت'] || '',
      status: 'مكتمل',
      sortKey: buildDateTime(row['التاريخ'], row['الوقت'])
    }));

    const activities = [...transfers, ...collections]
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, 10);

    if (!activities.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <i class="fas fa-inbox"></i>
            لا توجد عمليات حديثة
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = activities.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><code class="ref-code">${escapeHtml(item.ref)}</code></td>
        <td>${escapeHtml(item.type)}</td>
        <td>${escapeHtml(item.merchantName)}</td>
        <td>${escapeHtml(item.activityName)}</td>
        <td>${formatMoney(item.amount)}</td>
        <td>${formatDate(item.date)}</td>
        <td>${formatTime(item.time || '-')}</td>
        <td><span class="badge badge-success">${escapeHtml(item.status)}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Recent Activities Error:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          حدث خطأ أثناء تحميل آخر العمليات
        </td>
      </tr>
    `;
  }
}

export async function loadTopMachines() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const tbody = document.getElementById('topMachinesBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="empty-state">
        <i class="fas fa-spinner fa-pulse"></i>
        جاري تحميل البيانات...
      </td>
    </tr>
  `;

  try {
    const [machinesRes, transfersRes] = await Promise.all([
      supabase.from('machines').select('*'),
      supabase.from('transfers').select('*')
    ]);

    if (machinesRes.error) throw machinesRes.error;
    if (transfersRes.error) throw transfersRes.error;

    const machines = machinesRes.data || [];
    const transfers = transfersRes.data || [];

    if (!machines.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <i class="fas fa-desktop"></i>
            لا توجد مكن مسجلة
          </td>
        </tr>
      `;
      return;
    }

    const rows = machines.map(machine => {
      const merchantId = machine['رقم التاجر'];
      const merchantTransfers = transfers.filter(t => t['رقم التاجر'] === merchantId);
      const achieved = merchantTransfers.reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
      const target = safeNumber(machine['التارجت الشهري']);
      const percentage = target > 0 ? (achieved / target) * 100 : 0;

      return {
        merchantCode: machine['رقم التاجر'] || '-',
        merchantName: machine['اسم التاجر'] || '-',
        activityName: machine['اسم النشاط'] || '-',
        machineCode: machine['رقم المكنة'] || '-',
        serial: machine['الرقم التسلسلي'] || '-',
        target,
        achieved,
        percentage
      };
    });

    const sorted = rows
      .sort((a, b) => b.percentage - a.percentage || b.achieved - a.achieved)
      .slice(0, 10);

    tbody.innerHTML = sorted.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(String(item.merchantCode))}</td>
        <td>${escapeHtml(item.merchantName)}</td>
        <td>${escapeHtml(item.activityName)}</td>
        <td>${escapeHtml(item.machineCode)}</td>
        <td>${escapeHtml(item.serial)}</td>
        <td>${formatMoney(item.target)}</td>
        <td class="achieved-highlight">${formatMoney(item.achieved)}</td>
        <td>
          <div class="progress-wrapper">
            <div class="progress-bar-bg">
              <div class="progress-fill" style="width:${Math.min(item.percentage, 100)}%"></div>
            </div>
            <span class="percentage-text">${item.percentage.toFixed(1)}%</span>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Top Machines Error:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          حدث خطأ أثناء تحميل أعلى المكن
        </td>
      </tr>
    `;
  }
}
