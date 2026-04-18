
import { getTodayDate } from '../utils/helpers.js';

let supabase = null;

export function initDashboardPage() { supabase = window.supabaseClient; }

function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = typeof value === 'number' ? value.toLocaleString('ar-EG') : value; }

export async function loadDashboardStats() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;
  const today = getTodayDate();
  const [mc, mac, transfers, collections, todayTransfers] = await Promise.all([
    supabase.from('merchants').select('*', { count:'exact', head:true }),
    supabase.from('machines').select('*', { count:'exact', head:true }),
    supabase.from('transfers').select('قيمة التحويل'),
    supabase.from('collections').select('قيمة التحصيل'),
    supabase.from('transfers').select('قيمة التحويل').eq('التاريخ', today)
  ]);
  setText('totalMerchants', mc.count || 0);
  setText('totalMachines', mac.count || 0);
  const totalTransfers=(transfers.data||[]).reduce((s,r)=>s+(parseFloat(r['قيمة التحويل'])||0),0);
  const totalCollections=(collections.data||[]).reduce((s,r)=>s+(parseFloat(r['قيمة التحصيل'])||0),0);
  const todaySum=(todayTransfers.data||[]).reduce((s,r)=>s+(parseFloat(r['قيمة التحويل'])||0),0);
  setText('totalTransfers', totalTransfers);
  setText('totalCollections', totalCollections);
  setText('totalRemaining', Math.max(0,totalTransfers-totalCollections));
  setText('todayTransfers', todaySum);
}

export async function loadRecentActivities() {}
export async function loadTopMachines() {}
