
import { showToast, showConfirm } from '../ui/toast.js';
import { escapeHtml, formatMoney, formatDate, formatTime } from '../utils/formatters.js';

let supabase = null;
let currentCollections = [];
let merchantsList = [];
let machinesList = [];

export function initCollectionsPage() { supabase = window.supabaseClient; }

async function ensureLists() {
  const m1 = await supabase.from('merchants').select('*').order('updated_at', { ascending: false });
  if (m1.error) throw m1.error; merchantsList = m1.data || [];
  const m2 = await supabase.from('machines').select('*').order('updated_at', { ascending: false });
  if (m2.error) throw m2.error; machinesList = m2.data || [];
}
function merchantById(id){ return merchantsList.find(m=>m.id===id); }
function fillMerchantDatalist(){ const dl=document.getElementById('merchantDatalistColl'); if(dl) dl.innerHTML=merchantsList.map(m=>`<option value="${escapeHtml(m['رقم التاجر'])}">${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}</option>`).join(''); }
function fillMachinesSelect(){ const el=document.getElementById('collMachineId'); if(!el) return; el.innerHTML='<option value="">بدون مكنة</option>'+machinesList.map(m=>`<option value="${escapeHtml(m['رقم المكنة'])}">${escapeHtml(m['رقم المكنة'])}</option>`).join(''); }
function attachSearch(){ const s=document.getElementById('collMerchantSearch'); const h=document.getElementById('collMerchantId'); if(!s||!h) return; s.onchange=s.oninput=()=>{ const m=merchantsList.find(x=>x['رقم التاجر']===s.value || `${x['رقم التاجر']} - ${x['اسم التاجر']}`===s.value); h.value=m?.id||''; }; }

export async function loadCollections(){ supabase=supabase||window.supabaseClient; if(!supabase) return; try{ const {data,error}=await supabase.from('collections').select('*').order('created_at',{ascending:false}); if(error) throw error; currentCollections=data||[]; await ensureLists(); renderCollectionsTable(); }catch(err){ console.error(err); showToast('خطأ في تحميل التحصيلات','error'); } }
function renderCollectionsTable(){ const tbody=document.getElementById('collectionsTableBody'); if(!tbody) return; if(!currentCollections.length){ tbody.innerHTML='<tr><td colspan="9" class="empty-state">لا توجد تحصيلات</td></tr>'; return; } tbody.innerHTML=currentCollections.map((t,idx)=>`<tr><td>${idx+1}</td><td><code class="ref-code">${escapeHtml(t['الرقم المرجعي']||'-')}</code></td><td>${formatDate(t['التاريخ'])}</td><td>${escapeHtml(t['اسم التاجر']||'-')}</td><td>${escapeHtml(t['اسم النشاط']||'-')}</td><td>${escapeHtml(t['رقم المكنة']||'-')}</td><td>${formatMoney(t['قيمة التحصيل']||0)}</td><td>${escapeHtml(t['نوع التحصيل']||'-')}</td><td><div class="action-btns"><button class="btn btn-primary btn-sm" onclick="window.editCollection('${t.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-sm" onclick="window.deleteCollection('${t.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join(''); }
export async function openCollectionModal(transfer=null){ await ensureLists(); fillMerchantDatalist(); fillMachinesSelect(); attachSearch(); document.getElementById('collectionModalTitle').innerHTML=transfer?'<i class="fas fa-edit"></i> تعديل تحصيل':'<i class="fas fa-exchange-alt"></i> تحصيل جديد'; document.getElementById('editCollectionId').value=transfer?.id||''; document.getElementById('collMerchantId').value=transfer?.['رقم التاجر']||''; const merchant=merchantById(transfer?.['رقم التاجر']); document.getElementById('collMerchantSearch').value=merchant?.['رقم التاجر']||''; document.getElementById('collMachineId').value=transfer?.['رقم المكنة']||''; document.getElementById('collAmount').value=transfer?.['قيمة التحصيل']||''; document.getElementById('collType').value=transfer?.['نوع التحصيل']||'نقدي'; document.getElementById('collNotes').value=transfer?.['ملاحظات']||''; document.getElementById('collectionModal').classList.add('show'); }
export function closeCollectionModal(){ document.getElementById('collectionModal')?.classList.remove('show'); }
export async function saveCollection(){ const id=document.getElementById('editCollectionId').value; const merchant=merchantById(document.getElementById('collMerchantId').value); if(!merchant) return showToast('يرجى اختيار التاجر من القائمة','warning'); const amount=parseFloat(document.getElementById('collAmount').value||'0'); if(!(amount>0)) return showToast('يرجى إدخال مبلغ صحيح','warning'); const payload={'رقم التاجر':merchant.id,'اسم التاجر':merchant['اسم التاجر'],'اسم النشاط':merchant['اسم النشاط']||'غير محدد','رقم الحساب':merchant['رقم الحساب']||'','رقم المكنة':document.getElementById('collMachineId').value||null,'قيمة التحصيل':amount,'نوع التحصيل':document.getElementById('collType').value||'نقدي','ملاحظات':document.getElementById('collNotes').value.trim()}; try{ const q=id?supabase.from('collections').update(payload).eq('id',id):supabase.from('collections').insert([payload]); const {error}=await q; if(error) throw error; showToast(id?'تم تحديث التحصيل':'تم إضافة التحصيل','success'); closeCollectionModal(); await loadCollections(); window.loadDashboardStats?.(); }catch(err){ console.error(err); showToast(err.message||'فشل حفظ التحصيل','error'); } }
export function editCollection(id){ const item=currentCollections.find(t=>t.id===id); if(item) openCollectionModal(item); }
export function deleteCollection(id){ showConfirm('هل تريد حذف هذا التحصيل؟', async()=>{ const {error}=await supabase.from('collections').delete().eq('id',id); if(error) return showToast(error.message,'error'); showToast('تم حذف التحصيل','success'); await loadCollections(); window.loadDashboardStats?.(); }); }
window.openCollectionModal=openCollectionModal; window.closeCollectionModal=closeCollectionModal; window.saveCollection=saveCollection; window.editCollection=editCollection; window.deleteCollection=deleteCollection;
