let supabase = null;

function getClient() {
  supabase = supabase || window.supabaseClient || window.supabase;
  return supabase;
}

function money(value) {
  return `${(parseFloat(value) || 0).toLocaleString('ar-EG')} ج.م`;
}

function normalizeArabic(text) {
  return String(text || '')
    .trim()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function safeNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function detectMerchant(context, question) {
  const q = normalizeArabic(question);
  return (context.merchants || []).find(merchant => {
    const fields = [merchant['اسم التاجر'], merchant['رقم التاجر'], merchant['رقم الحساب'], merchant['اسم النشاط']];
    return fields.some(field => normalizeArabic(field).includes(q) || q.includes(normalizeArabic(field)));
  }) || null;
}

function calculateDebtForMerchant(merchantId, context) {
  const totalTransfers = (context.transfers || []).filter(item => item['رقم التاجر'] === merchantId).reduce((sum, item) => sum + safeNumber(item['قيمة التحويل']), 0);
  const totalCollections = (context.collections || []).filter(item => item['رقم التاجر'] === merchantId).reduce((sum, item) => sum + safeNumber(item['قيمة التحصيل']), 0);
  return { totalTransfers, totalCollections, debt: Math.max(0, totalTransfers - totalCollections) };
}

function buildMerchantStatement(merchant, context) {
  const machines = (context.machines || []).filter(machine => machine['رقم التاجر'] === merchant.id);
  const merchantTransfers = (context.transfers || []).filter(item => item['رقم التاجر'] === merchant.id);
  const merchantCollections = (context.collections || []).filter(item => item['رقم التاجر'] === merchant.id);
  const { totalTransfers, totalCollections, debt } = calculateDebtForMerchant(merchant.id, context);
  const recentTransfers = merchantTransfers.slice(-3).reverse().map(item => `- تحويل ${item['الرقم المرجعي'] || '—'} بقيمة ${money(item['قيمة التحويل'])}`).join('\n') || '- لا توجد تحويلات حديثة';
  const recentCollections = merchantCollections.slice(-3).reverse().map(item => `- تحصيل ${item['الرقم المرجعي'] || '—'} بقيمة ${money(item['قيمة التحصيل'])}`).join('\n') || '- لا توجد تحصيلات حديثة';
  return [
    `كشف مختصر للتاجر: ${merchant['اسم التاجر'] || '—'}`,
    `رقم التاجر: ${merchant['رقم التاجر'] || '—'}`,
    `رقم الحساب: ${merchant['رقم الحساب'] || '—'}`,
    `النشاط: ${merchant['اسم النشاط'] || '—'}`,
    `عدد المكن المرتبط: ${machines.length}`,
    `إجمالي التحويلات: ${money(totalTransfers)}`,
    `إجمالي التحصيلات: ${money(totalCollections)}`,
    `المديونية الحالية: ${money(debt)}`,
    'آخر التحويلات:',
    recentTransfers,
    'آخر التحصيلات:',
    recentCollections
  ].join('\n');
}

export async function processQuery(question, context = {}) {
  const q = normalizeArabic(question);
  if (!q) return 'اكتب سؤالك أولاً.';

  if (q.includes('مساعده') || q.includes('help')) {
    return 'يمكنني الإجابة عن: عدد التجار، عدد المكن، إجمالي التحويلات، إجمالي التحصيلات، المديونية، الطلبات المعلقة، أكبر مديونية، وكشف مختصر لأي تاجر بالاسم أو رقم التاجر أو رقم الحساب.';
  }

  if (q.includes('عدد التجار')) {
    return `عدد التجار الحالي: ${(context.merchants || []).length}`;
  }

  if (q.includes('عدد المكن')) {
    return `عدد المكن الحالي: ${(context.machines || []).length}`;
  }

  if (q.includes('اجمالي التحويلات') || q.includes('التحويلات')) {
    const total = (context.transfers || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    return `إجمالي التحويلات: ${money(total)}`;
  }

  if (q.includes('اجمالي التحصيلات') || q.includes('التحصيلات')) {
    const total = (context.collections || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
    return `إجمالي التحصيلات: ${money(total)}`;
  }

  if (q.includes('مديونيه') || q.includes('الرصيد') || q.includes('المتبقي')) {
    const totalTransfers = (context.transfers || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    const totalCollections = (context.collections || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
    return `المديونية الإجمالية الحالية: ${money(Math.max(0, totalTransfers - totalCollections))}`;
  }

  if (q.includes('طلبات') || q.includes('طلب')) {
    const pending = (context.requests || []).filter(item => item['الحالة'] === 'معلق').length;
    return `عدد الطلبات المعلقة حالياً: ${pending}`;
  }

  if (q.includes('اكبر مديونيه') || q.includes('اعلى مديونيه') || q.includes('اكبر تاجر')) {
    const ranked = (context.merchants || []).map(merchant => ({ merchant, ...calculateDebtForMerchant(merchant.id, context) }))
      .sort((a, b) => b.debt - a.debt)
      .filter(item => item.debt > 0)
      .slice(0, 5);
    if (!ranked.length) return 'لا توجد مديونيات حالية على التجار.';
    return 'أعلى 5 مديونيات حالياً:\n' + ranked.map((item, index) => `${index + 1}) ${item.merchant['اسم التاجر']} — ${money(item.debt)}`).join('\n');
  }

  if (q.includes('كشف') || q.includes('حساب') || q.includes('بيانات تاجر') || q.includes('تفاصيل تاجر')) {
    const merchant = detectMerchant(context, question);
    if (!merchant) {
      return 'لم أحدد التاجر المقصود. اكتب اسم التاجر أو رقم التاجر أو رقم الحساب داخل السؤال.';
    }
    return buildMerchantStatement(merchant, context);
  }

  return 'لم أفهم الطلب بالكامل. جرّب سؤالاً مثل: ما إجمالي التحويلات؟ من أعلى مديونية؟ اعرض كشف التاجر فلان أو رقم الحساب كذا.';
}

export async function processAiQuery(question, context = {}) {
  return processQuery(question, context);
}

export function initAIService() {
  supabase = window.supabaseClient || window.supabase || null;
}
