import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, normalizeText } from '../utils/formatters.js';

let supabase = null;
let currentTransfers = [];
let merchantsList = [];
let machinesList = [];
let listsLoaded = false;
let isSavingTransfer = false;

export function initTransfersPage() { supabase = window.supabaseClient; }

async function ensureLists(force = false) {
  if (listsLoaded && !force) return;
  const [m1, m2] = await Promise.all([
    supabase.from('merchants').select('*'),
    supabase.from('machines').select('*')
  ]);
  if (m1.error) throw m1.error;
  if (m2.error) throw m2.error;
  merchantsList = m1.data || [];
  machinesList = m2.data || [];
  listsLoaded = true;
}

function merchantLabel(m) { return `${m['رقم التاجر']} - ${m['اسم التاجر']} (${m['اسم النشاط'] || 'غير محدد'})`; }
function merchantById(id) { return merchantsList.find(m => m.id === id); }
function resolveMerchant(inputValue) {
  const raw = String(inputValue || '').trim();
  const norm = normalizeText(raw);
  return merchantsList.find(x => {
    const code = String(x['رقم التاجر'] || '');
    const name = String(x['اسم التاجر'] || '');
    const activity = String(x['اسم النشاط'] || '');
    const full = merchantLabel(x);
    return code === raw || full === raw || normalizeText(code) === norm || normalizeText(name).includes(norm) || normalizeText(activity).includes(norm) || normalizeText(full).includes(norm);
  }) || null;
}
function fillMerchantDatalist() {
  const dl = document.getElementById('merchantDatalistTrans');
  if (dl) dl.innerHTML = merchantsList.map(m => `<option value="${escapeHtml(merchantLabel(m))}"></option>`).join('');
}
function fillMachinesSelect(merchantId = '', selectedMachine = '') {
  const el = document.getElementById('transMachineId');
  if (!el) return;
  const filtered = merchantId ? machinesList.filter(m => m['رقم التاجر'] === merchantId) : [];
  el.innerHTML = '<option value="">بدون مكنة</option>' + filtered.map(m => `<option value="${escapeHtml(m['رقم المكنة'])}" ${m['رقم المكنة']===selectedMachine?'selected':''}>${escapeHtml(m['رقم المكنة'])}</option>`).join('');
}
function attachSearch() {
  const s = document.getElementById('transMerchantSearch');
  const h = document.getElementById('transMerchantId');
  if (!s || !h) return;
  s.oninput = () => { const m = resolveMerchant(s.value); h.value = m?.id || ''; if (m) fillMachinesSelect(m.id); };
  s.onchange = () => { const m = resolveMerchant(s.value); h.value = m?.id || ''; s.value = m ? merchantLabel(m) : ''; fillMachinesSelect(m?.id || ''); };
}
function getNowDateTime() { const now = new Date(); return { date: now.toISOString().split('T')[0], time: now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }; }
function buildDateTime(d,t){ try{return new Date(`${d||''} ${t||'12:00 AM'}`).getTime()||0;}catch{return 0;} }
function clearForm(){ document.getElementById('editTransferId').value=''; document.getElementById('transMerchantId').value=''; document.getElementById('transMerchantSearch').value=''; document.getElementById('transAmount').value=''; document.getElementById('transType').value='نقدي'; document.getElementById('transNotes').value=''; fillMachinesSelect(''); }

export async function loadTransfers() {
  supabase = supabase || window.supabaseClient; if (!supabase) return;
  try {
    const { data, error } = await supabase.from('transfers').select('*');
    if (error) throw error;
    currentTransfers = (data || []).sort((a,b)=>buildDateTime(b['التاريخ'],b['الوقت'])-buildDateTime(a['التاريخ'],a['الوقت']));
    await ensureLists(true);
    renderTransfersTable();
  } catch (err) { console.error(err); showToast('خطأ في تحميل التحويلات', 'error'); }
}
function renderTransfersTable() {
  const tbody = document.getElementById('transfersTableBody'); if (!tbody) return;
  if (!currentTransfers.length) { tbody.innerHTML='<tr><td colspan="9" class="empty-state">لا توجد تحويلات</td></tr>'; return; }
  tbody.innerHTML = currentTransfers.map((t, idx)=>`<tr><td>${idx+1}</td><td><code class="ref-code">${escapeHtml(t['الرقم المرجعي']||'-')}</code></td><td>${formatDate(t['التاريخ'])}</td><td>${escapeHtml(t['الوقت']||'-')}</td><td>${escapeHtml(t['اسم التاجر']||'-')}</td><td>${escapeHtml(t['اسم النشاط']||'-')}</td><td>${formatMoney(t['قيمة التحويل']||0)}</td><td>${escapeHtml(t['ملاحظات']||'-')}</td><td><div class="action-btns"><button class="btn btn-primary btn-sm" onclick="window.editTransfer('${t.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-sm" onclick="window.deleteTransfer('${t.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}
export async function openTransferModal(transfer = null) {
  supabase = supabase || window.supabaseClient; await ensureLists(true); fillMerchantDatalist(); attachSearch(); if (!transfer) clearForm();
  document.getElementById('transferModalTitle').innerHTML = transfer ? '<i class="fas fa-edit"></i> تعديل تحويل' : '<i class="fas fa-exchange-alt"></i> تحويل جديد';
  document.getElementById('editTransferId').value = transfer?.id || '';
  document.getElementById('transAmount').value = transfer?.['قيمة التحويل'] || '';
  document.getElementById('transType').value = transfer?.['نوع التحويل'] || 'نقدي';
  document.getElementById('transNotes').value = transfer?.['ملاحظات'] || '';
  const merchant = merchantById(transfer?.['رقم التاجر']);
  document.getElementById('transMerchantId').value = merchant?.id || '';
  document.getElementById('transMerchantSearch').value = merchant ? merchantLabel(merchant) : '';
  fillMachinesSelect(merchant?.id || '', transfer?.['رقم المكنة'] || '');
  document.getElementById('transferModal').classList.add('show');
}
export function closeTransferModal(){ document.getElementById('transferModal')?.classList.remove('show'); clearForm(); }
export async function saveTransfer() {
  if (isSavingTransfer) return; isSavingTransfer = true;
  try {
    supabase = supabase || window.supabaseClient;
    const id = document.getElementById('editTransferId').value;
    const merchant = merchantById(document.getElementById('transMerchantId').value);
    if (!merchant) return showToast('يرجى اختيار التاجر من القائمة', 'warning');
    const amount = parseFloat(document.getElementById('transAmount').value || '0');
    if (!(amount > 0)) return showToast('المبلغ غير صحيح', 'warning');
    const { date, time } = getNowDateTime();
    const payload = {'رقم التاجر':merchant.id,'اسم التاجر':merchant['اسم التاجر'],'اسم النشاط':merchant['اسم النشاط']||'غير محدد','رقم الحساب':merchant['رقم الحساب']||'','رقم المكنة':document.getElementById('transMachineId').value||null,'قيمة التحويل':amount,'نوع التحويل':document.getElementById('transType').value||'نقدي','ملاحظات':document.getElementById('transNotes').value.trim(),'التاريخ':date,'الوقت':time};
    const query = id ? supabase.from('transfers').update(payload).eq('id', id) : supabase.from('transfers').insert([payload]);
    const { error } = await query; if (error) throw error;
    showToast(id ? 'تم تعديل التحويل' : 'تم إضافة التحويل', 'success');
    closeTransferModal(); await loadTransfers(); window.loadDashboardStats?.(); window.loadRecentActivities?.(); window.loadTopMachines?.();
  } catch (err) { console.error(err); showToast(err.message || 'فشل حفظ التحويل', 'error'); } finally { isSavingTransfer = false; }
}
export function editTransfer(id){ const item=currentTransfers.find(t=>t.id===id); if(item) openTransferModal(item); }
export async function deleteTransfer(id){ supabase = supabase || window.supabaseClient; showConfirm('هل تريد حذف هذا التحويل؟', async()=>{ try{ const {error}=await supabase.from('transfers').delete().eq('id',id); if(error) throw error; showToast('تم حذف التحويل','success'); await loadTransfers(); window.loadDashboardStats?.(); window.loadRecentActivities?.(); window.loadTopMachines?.(); }catch(err){ console.error(err); showToast(err.message || 'فشل حذف التحويل','error'); } }); }
window.openTransferModal=openTransferModal; window.closeTransferModal=closeTransferModal; window.saveTransfer=saveTransfer; window.editTransfer=editTransfer; window.deleteTransfer=deleteTransfer;
