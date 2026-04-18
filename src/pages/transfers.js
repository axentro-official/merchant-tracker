
import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';

let supabase = null;
let currentTransfers = [];
let merchantsList = [];
let machinesList = [];

export function initTransfersPage() { supabase = window.supabaseClient; }

async function ensureLists() {
  const m1 = await supabase.from('merchants').select('*').order('updated_at', { ascending: false });
  if (m1.error) throw m1.error; merchantsList = m1.data || [];
  const m2 = await supabase.from('machines').select('*').order('updated_at', { ascending: false });
  if (m2.error) throw m2.error; machinesList = m2.data || [];
}
function merchantById(id){ return merchantsList.find(m=>m.id===id); }
function fillMerchantDatalist(){ const dl=document.getElementById('merchantDatalistTrans'); if(dl) dl.innerHTML=merchantsList.map(m=>`<option value="${escapeHtml(m['رقم التاجر'])}">${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}</option>`).join(''); }
function fillMachinesSelect(){ const el=document.getElementById('transMachineId'); if(!el) return; el.innerHTML='<option value="">بدون مكنة</option>'+machinesList.map(m=>`<option value="${escapeHtml(m['رقم المكنة'])}">${escapeHtml(m['رقم المكنة'])}</option>`).join(''); }
function attachSearch(){ const s=document.getElementById('transMerchantSearch'); const h=document.getElementById('transMerchantId'); if(!s||!h) return; s.onchange=s.oninput=()=>{ const m=merchantsList.find(x=>x['رقم التاجر']===s.value || `${x['رقم التاجر']} - ${x['اسم التاجر']}`===s.value); h.value=m?.id||''; }; }

export async function loadTransfers(){ supabase=supabase||window.supabaseClient; if(!supabase) return; try{ const {data,error}=await supabase.from('transfers').select('*').order('created_at',{ascending:false}); if(error) throw error; currentTransfers=data||[]; await ensureLists(); renderTransfersTable(); }catch(err){ console.error(err); showToast('خطأ في تحميل التحويلات','error'); } }
function renderTransfersTable(){ const tbody=document.getElementById('transfersTableBody'); if(!tbody) return; if(!currentTransfers.length){ tbody.innerHTML='<tr><td colspan="9" class="empty-state">لا توجد تحويلات</td></tr>'; return; } tbody.innerHTML=currentTransfers.map((t,idx)=>`<tr><td>${idx+1}</td><td><code class="ref-code">${escapeHtml(t['الرقم المرجعي']||'-')}</code></td><td>${formatDate(t['التاريخ'])}</td><td>${escapeHtml(t['اسم التاجر']||'-')}</td><td>${escapeHtml(t['اسم النشاط']||'-')}</td><td>${escapeHtml(t['رقم المكنة']||'-')}</td><td>${formatMoney(t['قيمة التحويل']||0)}</td><td>${escapeHtml(t['نوع التحويل']||'-')}</td><td><div class="action-btns"><button class="btn btn-primary btn-sm" onclick="window.editTransfer('${t.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-sm" onclick="window.deleteTransfer('${t.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''); }
export async function openTransferModal(transfer=null){ await ensureLists(); fillMerchantDatalist(); fillMachinesSelect(); attachSearch(); document.getElementById('transferModalTitle').innerHTML=transfer?'<i class="fas fa-edit"></i> تعديل تحويل':'<i class="fas fa-exchange-alt"></i> تحويل جديد'; document.getElementById('editTransferId').value=transfer?.id||''; document.getElementById('transMerchantId').value=transfer?.['رقم التاجر']||''; const merchant=merchantById(transfer?.['رقم التاجر']); document.getElementById('transMerchantSearch').value=merchant?.['رقم التاجر']||''; document.getElementById('transMachineId').value=transfer?.['رقم المكنة']||''; document.getElementById('transAmount').value=transfer?.['قيمة التحويل']||''; document.getElementById('transType').value=transfer?.['نوع التحويل']||'نقدي'; document.getElementById('transNotes').value=transfer?.['ملاحظات']||''; document.getElementById('transferModal').classList.add('show'); }
export function closeTransferModal(){ document.getElementById('transferModal')?.classList.remove('show'); }
export async function saveTransfer(){ const id=document.getElementById('editTransferId').value; const merchant=merchantById(document.getElementById('transMerchantId').value); if(!merchant) return showToast('يرجى اختيار التاجر من القائمة','warning'); const amount=parseFloat(document.getElementById('transAmount').value||'0'); if(!(amount>0)) return showToast('يرجى إدخال مبلغ صحيح','warning'); const payload={'رقم التاجر':merchant.id,'اسم التاجر':merchant['اسم التاجر'],'اسم النشاط':merchant['اسم النشاط']||'غير محدد','رقم الحساب':merchant['رقم الحساب']||'','رقم المكنة':document.getElementById('transMachineId').value||null,'قيمة التحويل':amount,'نوع التحويل':document.getElementById('transType').value||'نقدي','ملاحظات':document.getElementById('transNotes').value.trim()}; try{ const q=id?supabase.from('transfers').update(payload).eq('id',id):supabase.from('transfers').insert([payload]); const {error}=await q; if(error) throw error; showToast(id?'تم تحديث التحويل':'تم إضافة التحويل','success'); closeTransferModal(); await loadTransfers(); window.loadDashboardStats?.(); }catch(err){ console.error(err); showToast(err.message||'فشل حفظ التحويل','error'); } }
export function editTransfer(id){ const item=currentTransfers.find(t=>t.id===id); if(item) openTransferModal(item); }
export function deleteTransfer(id){ showConfirm('هل تريد حذف هذا التحويل؟', async()=>{ const {error}=await supabase.from('transfers').delete().eq('id',id); if(error) return showToast(error.message,'error'); showToast('تم حذف التحويل','success'); await loadTransfers(); window.loadDashboardStats?.(); }); }
window.openTransferModal=openTransferModal; window.closeTransferModal=closeTransferModal; window.saveTransfer=saveTransfer; window.editTransfer=editTransfer; window.deleteTransfer=deleteTransfer;
