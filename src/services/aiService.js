// src/services/aiService.js
let supabase = null;

function getClient() {
  supabase = supabase || window.supabaseClient || window.supabase;
  return supabase;
}

async function getCount(tableName) {
  const client = getClient();
  if (!client) return 0;
  const { count, error } = await client.from(tableName).select('*', { count: 'exact', head: true });
  return error ? 0 : (count || 0);
}

async function getSum(tableName, column) {
  const client = getClient();
  if (!client) return 0;
  const { data, error } = await client.from(tableName).select(column);
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
}

export async function processQuery(question, context = {}) {
  const q = String(question || '').trim().toLowerCase();
  if (!q) return 'اكتب سؤالك أولاً.';

  if (q.includes('مساعدة') || q.includes('help')) {
    return 'يمكنني مساعدتك في عدد التجار، عدد المكن، إجمالي التحويلات، إجمالي التحصيلات، المتبقي، والطلبات المعلقة.';
  }

  if (q.includes('عدد التجار') || q.includes('التجار')) {
    const count = context.merchants?.length || await getCount('merchants');
    return `عدد التجار الحالي: ${count}`;
  }

  if (q.includes('عدد المكن') || q.includes('المكن')) {
    const count = context.machines?.length || await getCount('machines');
    return `عدد المكن الحالي: ${count}`;
  }

  if (q.includes('تحويلات') || q.includes('إجمالي التحويلات')) {
    const total = (context.transfers || []).reduce((s, r) => s + (parseFloat(r['قيمة التحويل']) || 0), 0) || await getSum('transfers', 'قيمة التحويل');
    return `إجمالي التحويلات: ${total.toLocaleString('ar-EG')} ج.م`;
  }

  if (q.includes('تحصيلات') || q.includes('إجمالي التحصيلات')) {
    const total = (context.collections || []).reduce((s, r) => s + (parseFloat(r['قيمة التحصيل']) || 0), 0) || await getSum('collections', 'قيمة التحصيل');
    return `إجمالي التحصيلات: ${total.toLocaleString('ar-EG')} ج.م`;
  }

  if (q.includes('المتبقي') || q.includes('الرصيد') || q.includes('مديونية')) {
    const transfers = (context.transfers || []).reduce((s, r) => s + (parseFloat(r['قيمة التحويل']) || 0), 0) || await getSum('transfers', 'قيمة التحويل');
    const collections = (context.collections || []).reduce((s, r) => s + (parseFloat(r['قيمة التحصيل']) || 0), 0) || await getSum('collections', 'قيمة التحصيل');
    return `المتبقي الحالي: ${(transfers - collections).toLocaleString('ar-EG')} ج.م`;
  }

  const pendingRequests = (context.requests || []).filter(r => r['الحالة'] === 'معلق').length || await (async()=>{
    const client = getClient();
    if (!client) return 0;
    const { count } = await client.from('requests').select('*', { count: 'exact', head: true }).eq('الحالة', 'معلق');
    return count || 0;
  })();

  if (q.includes('طلب') || q.includes('طلبات')) {
    return `عدد الطلبات المعلقة: ${pendingRequests}`;
  }

  return 'لم أفهم الطلب بالكامل. جرّب: عدد التجار، عدد المكن، إجمالي التحويلات، إجمالي التحصيلات، المتبقي، أو الطلبات المعلقة.';
}

export async function processAiQuery(question, context = {}) {
  return processQuery(question, context);
}

export function initAIService() {
  supabase = window.supabaseClient || window.supabase || null;
}
