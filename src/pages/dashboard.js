import { getTodayDate } from '../utils/helpers.js';

let supabase = null;

export function initDashboardPage() {
  supabase = window.supabaseClient;
}

// =========================
// Helpers
// =========================
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent =
      typeof value === 'number'
        ? value.toLocaleString('ar-EG')
        : value;
  }
}

function safeNumber(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// =========================
// Stats
// =========================
export async function loadDashboardStats() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const today = getTodayDate();

  const [mc, mac, transfers, collections, todayTransfers] =
    await Promise.all([
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      supabase.from('machines').select('*', { count: 'exact', head: true }),
      supabase.from('transfers').select('قيمة التحويل'),
      supabase.from('collections').select('قيمة التحصيل'),
      supabase.from('transfers').select('قيمة التحويل').eq('التاريخ', today)
    ]);

  setText('totalMerchants', mc.count || 0);
  setText('totalMachines', mac.count || 0);

  const totalTransfers = (transfers.data || []).reduce(
    (s, r) => s + safeNumber(r['قيمة التحويل']),
    0
  );

  const totalCollections = (collections.data || []).reduce(
    (s, r) => s + safeNumber(r['قيمة التحصيل']),
    0
  );

  const todaySum = (todayTransfers.data || []).reduce(
    (s, r) => s + safeNumber(r['قيمة التحويل']),
    0
  );

  setText('totalTransfers', totalTransfers);
  setText('totalCollections', totalCollections);
  setText('totalRemaining', Math.max(0, totalTransfers - totalCollections));
  setText('todayTransfers', todaySum);
}

// =========================
// Recent Activities (FIXED)
// =========================
export async function loadRecentActivities() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const tbody = document.getElementById('recentActivityBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9">Loading...</td></tr>`;

  try {
    const [transfersRes, collectionsRes] = await Promise.all([
      supabase.from('transfers').select('*'),
      supabase.from('collections').select('*')
    ]);

    const transfers = (transfersRes.data || []).map(t => ({
      type: 'تحويل',
      amount: safeNumber(t['قيمة التحويل']),
      merchant: t['اسم التاجر'],
      activity: t['اسم النشاط'],
      date: t['التاريخ'],
      time: t['الوقت'],
      createdAt: t.created_at || `${t['التاريخ']} ${t['الوقت']}`
    }));

    const collections = (collectionsRes.data || []).map(c => ({
      type: 'تحصيل',
      amount: safeNumber(c['قيمة التحصيل']),
      merchant: c['اسم التاجر'],
      activity: c['اسم النشاط'],
      date: c['التاريخ'],
      time: c['الوقت'],
      createdAt: c.created_at || `${c['التاريخ']} ${c['الوقت']}`
    }));

    const activities = [...transfers, ...collections]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    if (!activities.length) {
      tbody.innerHTML = `<tr><td colspan="9">لا توجد بيانات</td></tr>`;
      return;
    }

    tbody.innerHTML = activities.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.type}</td>
        <td>${a.merchant}</td>
        <td>${a.activity}</td>
        <td>${a.amount.toLocaleString('ar-EG')}</td>
        <td>${a.date}</td>
        <td>${a.time}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="9">خطأ في التحميل</td></tr>`;
  }
}

// =========================
// Top Machines (FIXED)
// =========================
export async function loadTopMachines() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  const tbody = document.getElementById('topMachinesBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9">Loading...</td></tr>`;

  try {
    const [machinesRes, transfersRes] = await Promise.all([
      supabase.from('machines').select('*'),
      supabase.from('transfers').select('*')
    ]);

    const machines = machinesRes.data || [];
    const transfers = transfersRes.data || [];

    const stats = machines.map(m => {
      const merchantId = m['رقم التاجر'];

      const relatedTransfers = transfers.filter(
        t => t['رقم التاجر'] === merchantId
      );

      const achieved = relatedTransfers.reduce(
        (s, t) => s + safeNumber(t['قيمة التحويل']),
        0
      );

      const target = safeNumber(m['التارجت الشهري']);
      const percent = target ? (achieved / target) * 100 : 0;

      return {
        merchant: m['اسم التاجر'],
        machine: m['رقم المكنة'],
        target,
        achieved,
        percent
      };
    });

    const sorted = stats
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10);

    tbody.innerHTML = sorted.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.merchant}</td>
        <td>${s.machine}</td>
        <td>${s.target.toLocaleString('ar-EG')}</td>
        <td>${s.achieved.toLocaleString('ar-EG')}</td>
        <td>${s.percent.toFixed(1)}%</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="9">خطأ</td></tr>`;
  }
}
