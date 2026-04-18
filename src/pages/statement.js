
import { showToast } from '../ui/toast.js';
import { formatDate, formatMoney, escapeHtml } from '../utils/formatters.js';

let supabase = null;
let merchantsList = [];

export function initStatementPage() { supabase = window.supabaseClient; }

export async function loadMerchantsForStatement() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('merchants').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    merchantsList = data || [];
    const datalist = document.getElementById('merchantDatalistStmt');
    if (datalist) datalist.innerHTML = merchantsList.map(m => `<option value="${escapeHtml(m['رقم التاجر'])}">${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}</option>`).join('');
    const search = document.getElementById('stmtMerchantSearch');
    const hidden = document.getElementById('stmtMerchantId');
    if (search && hidden) search.onchange = search.oninput = () => { const m = merchantsList.find(x => x['رقم التاجر'] === search.value || `${x['رقم التاجر']} - ${x['اسم التاجر']}` === search.value); hidden.value = m?.id || ''; };
  } catch (err) { console.error(err); showToast('خطأ في تحميل قائمة التجار', 'error'); }
}

export async function loadStatement() {
  supabase = supabase || window.supabaseClient;
  const merchantId = document.getElementById('stmtMerchantId')?.value;
  const tbody = document.getElementById('statementTableBody');
  if (!tbody) return;
  if (!merchantId) { showToast('يرجى اختيار تاجر من القائمة', 'warning'); return; }
  try {
    const [transfersRes, collectionsRes] = await Promise.all([
      supabase.from('transfers').select('*').eq('رقم التاجر', merchantId).order('created_at', { ascending: true }),
      supabase.from('collections').select('*').eq('رقم التاجر', merchantId).order('created_at', { ascending: true })
    ]);
    if (transfersRes.error) throw transfersRes.error;
    if (collectionsRes.error) throw collectionsRes.error;
    const rows = [];
    (transfersRes.data || []).forEach(t => rows.push({ type:'تحويل', date:t['التاريخ'], ref:t['الرقم المرجعي'], debit:parseFloat(t['قيمة التحويل'])||0, credit:0, note:t['ملاحظات']||'', createdAt:t.created_at }));
    (collectionsRes.data || []).forEach(c => rows.push({ type:'تحصيل', date:c['التاريخ'], ref:c['الرقم المرجعي'], debit:0, credit:parseFloat(c['قيمة التحصيل'])||0, note:c['ملاحظات']||'', createdAt:c.created_at }));
    rows.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    if (!rows.length) { tbody.innerHTML='<tr><td colspan="7" class="empty-state">لا توجد حركة لهذا التاجر</td></tr>'; return; }
    let balance = 0;
    tbody.innerHTML = rows.map((r, idx) => { balance += r.debit - r.credit; return `<tr><td>${idx+1}</td><td>${formatDate(r.date)}</td><td>${escapeHtml(r.ref||'-')}</td><td>${escapeHtml(r.type)}</td><td>${r.debit ? formatMoney(r.debit) : '-'}</td><td>${r.credit ? formatMoney(r.credit) : '-'}</td><td>${formatMoney(balance)}</td></tr>`; }).join('');
  } catch (err) { console.error(err); showToast('حدث خطأ أثناء تحميل كشف الحساب', 'error'); }
}
