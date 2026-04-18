import { getTodayDate } from '../utils/helpers.js';

let supabase = null;

export function initDashboardPage() {
  supabase = window.supabaseClient;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = typeof value === 'number'
      ? value.toLocaleString('ar-EG')
      : value;
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('ar-EG');
}

function getActivityBadge(type) {
  if (type === 'تحويل') {
    return '<span class="badge badge-info">تحويل</span>';
  }
  if (type === 'تحصيل') {
    return '<span class="badge badge-success">تحصيل</span>';
  }
  return '<span class="badge badge-warning">غير محدد</span>';
}

export async function loadDashboardStats() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const today = getTodayDate();

  const [mc, mac, transfers, collections, todayTransfers] = await Promise.all([
    supabase.from('merchants').select('*', { count: 'exact', head: true }),
    supabase.from('machines').select('*', { count: 'exact', head: true }),
    supabase.from('transfers').select('*'),
    supabase.from('collections').select('*'),
    supabase.from('transfers').select('*').eq('التاريخ', today)
  ]);

  setText('totalMerchants', mc.count || 0);
  setText('totalMachines', mac.count || 0);

  const totalTransfers = (transfers.data || []).reduce(
    (s, r) => s + (parseFloat(r['قيمة التحويل']) || 0),
    0
  );

  const totalCollections = (collections.data || []).reduce(
    (s, r) => s + (parseFloat(r['قيمة التحصيل']) || 0),
    0
  );

  const todaySum = (todayTransfers.data || []).reduce(
    (s, r) => s + (parseFloat(r['قيمة التحويل']) || 0),
    0
  );

  setText('totalTransfers', totalTransfers);
  setText('totalCollections', totalCollections);
  setText('totalRemaining', Math.max(0, totalTransfers - totalCollections));
  setText('todayTransfers', todaySum);
}

export async function loadRecentActivities() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const tbody = document.getElementById('recentActivityBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="empty-state">
        <i class="fas fa-spinner fa-pulse"></i> جاري تحميل البيانات...
      </td>
    </tr>
  `;

  try {
    const [transfersRes, collectionsRes] = await Promise.all([
      supabase.from('transfers').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('collections').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    const transfers = (transfersRes.data || []).map(item => ({
      reference: item['الرقم المرجعي'] || '-',
      type: 'تحويل',
      merchantName: item['اسم التاجر'] || '-',
      activityName: item['اسم النشاط'] || '-',
      amount: parseFloat(item['قيمة التحويل']) || 0,
      date: item['التاريخ'] || '-',
      time: item['الوقت'] || '-',
      createdAt: item.created_at || '',
      status: 'مكتمل'
    }));

    const collections = (collectionsRes.data || []).map(item => ({
      reference: item['الرقم المرجعي'] || '-',
      type: 'تحصيل',
      merchantName: item['اسم التاجر'] || '-',
      activityName: item['اسم النشاط'] || '-',
      amount: parseFloat(item['قيمة التحصيل']) || 0,
      date: item['التاريخ'] || '-',
      time: item['الوقت'] || '-',
      createdAt: item.created_at || '',
      status: 'مكتمل'
    }));

    const activities = [...transfers, ...collections]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    if (!activities.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <i class="fas fa-inbox"></i> لا توجد عمليات حديثة
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = activities.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><span class="ref-code">${escapeHtml(item.reference)}</span></td>
        <td>${getActivityBadge(item.type)}</td>
        <td>${escapeHtml(item.merchantName)}</td>
        <td>${escapeHtml(item.activityName)}</td>
        <td>${formatMoney(item.amount)}</td>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.time)}</td>
        <td><span class="badge badge-success">${escapeHtml(item.status)}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('loadRecentActivities error:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <i class="fas fa-exclamation-circle"></i> تعذر تحميل آخر العمليات
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
        <i class="fas fa-spinner fa-pulse"></i> جاري تحميل البيانات...
      </td>
    </tr>
  `;

  try {
    const [machinesRes, transfersRes] = await Promise.all([
      supabase.from('machines').select('*'),
      supabase.from('transfers').select('*')
    ]);

    const machines = machinesRes.data || [];
    const transfers = transfersRes.data || [];

    if (!machines.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <i class="fas fa-desktop"></i> لا توجد مكن مسجلة
          </td>
        </tr>
      `;
      return;
    }

    const machineStats = machines.map(machine => {
      const machineNumber = machine['رقم المكنة'] || '';
      const machineTransfers = transfers.filter(
        tr => (tr['رقم المكنة'] || '') === machineNumber
      );

      const achieved = machineTransfers.reduce(
        (sum, tr) => sum + (parseFloat(tr['قيمة التحويل']) || 0),
        0
      );

      const target = parseFloat(machine['التارجت الشهري']) || 0;
      const percentage = target > 0 ? (achieved / target) * 100 : 0;

      return {
        merchantCode: machine['رقم التاجر'] || '-',
        merchantName: machine['اسم التاجر'] || '-',
        activityName: machine['اسم النشاط'] || '-',
        machineNumber: machine['رقم المكنة'] || '-',
        serial: machine['الرقم التسلسلي'] || '-',
        target,
        achieved,
        percentage
      };
    });

    const sortedMachines = machineStats
      .sort((a, b) => b.percentage - a.percentage || b.achieved - a.achieved)
      .slice(0, 10);

    tbody.innerHTML = sortedMachines.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.merchantCode)}</td>
        <td>${escapeHtml(item.merchantName)}</td>
        <td>${escapeHtml(item.activityName)}</td>
        <td>${escapeHtml(item.machineNumber)}</td>
        <td>${escapeHtml(item.serial)}</td>
        <td>${formatMoney(item.target)}</td>
        <td class="achieved-highlight">${formatMoney(item.achieved)}</td>
        <td>
          <div class="progress-wrapper">
            <div class="progress-bar-bg">
              <div class="progress-fill" style="width: ${Math.min(item.percentage, 100)}%;"></div>
            </div>
            <span class="percentage-text">${item.percentage.toFixed(1)}%</span>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('loadTopMachines error:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <i class="fas fa-exclamation-circle"></i> تعذر تحميل أعلى المكن
        </td>
      </tr>
    `;
  }
}
