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
    .replace(/[^\w\u0600-\u06FF\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function safeNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildDateValue(dateValue, timeValue) {
  const ts = new Date(`${dateValue || ''} ${timeValue || '12:00 AM'}`).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function includesAny(text, terms = []) {
  return terms.some(term => String(text || '').includes(term));
}

function tokenize(text) {
  return normalizeArabic(text).split(' ').filter(Boolean);
}

function detectMerchant(context, question) {
  const raw = String(question || '').trim();
  const q = normalizeArabic(question);
  const tokens = tokenize(question);
  const candidates = (context.merchants || []).map(merchant => {
    const fields = [merchant['اسم التاجر'], merchant['رقم التاجر'], merchant['رقم الحساب'], merchant['اسم النشاط'], merchant['رقم الهاتف']];
    let score = 0;
    for (const field of fields) {
      const normalizedField = normalizeArabic(field);
      if (!normalizedField) continue;
      if (String(field || '').trim() === raw) score += 20;
      if (normalizedField === q) score += 16;
      if (normalizedField.includes(q) && q) score += 10;
      if (q.includes(normalizedField) && normalizedField.length > 2) score += 8;
      for (const token of tokens) {
        if (token.length > 1 && normalizedField.includes(token)) score += 2;
      }
    }
    return { merchant, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.merchant || null;
}

function calculateDebtForMerchant(merchantId, context) {
  const totalTransfers = (context.transfers || []).filter(item => item['رقم التاجر'] === merchantId).reduce((sum, item) => sum + safeNumber(item['قيمة التحويل']), 0);
  const totalCollections = (context.collections || []).filter(item => item['رقم التاجر'] === merchantId).reduce((sum, item) => sum + safeNumber(item['قيمة التحصيل']), 0);
  return { totalTransfers, totalCollections, debt: Math.max(0, totalTransfers - totalCollections) };
}

function recentRowsForMerchant(merchantId, context) {
  const rows = [
    ...((context.transfers || []).filter(item => item['رقم التاجر'] === merchantId).map(item => ({
      type: item['نوع التحويل'] || 'تحويل',
      kind: 'تحويل',
      amount: safeNumber(item['قيمة التحويل']),
      ref: item['الرقم المرجعي'] || '—',
      date: item['التاريخ'] || '',
      time: item['الوقت'] || '',
      machine: item['رقم المكنة'] || '—'
    }))),
    ...((context.collections || []).filter(item => item['رقم التاجر'] === merchantId).map(item => ({
      type: item['نوع التحصيل'] || 'تحصيل',
      kind: 'تحصيل',
      amount: safeNumber(item['قيمة التحصيل']),
      ref: item['الرقم المرجعي'] || '—',
      date: item['التاريخ'] || '',
      time: item['الوقت'] || '',
      machine: item['رقم المكنة'] || '—'
    })))
  ].sort((a, b) => buildDateValue(b.date, b.time) - buildDateValue(a.date, a.time));
  return rows.slice(0, 5);
}

function buildMerchantStatement(merchant, context) {
  const machines = (context.machines || []).filter(machine => machine['رقم التاجر'] === merchant.id);
  const { totalTransfers, totalCollections, debt } = calculateDebtForMerchant(merchant.id, context);
  const recent = recentRowsForMerchant(merchant.id, context);
  const recentText = recent.length
    ? recent.map((row, index) => `${index + 1}) ${row.kind} • ${row.type} • ${money(row.amount)} • مرجع ${row.ref} • مكنة ${row.machine} • ${row.date} ${row.time}` ).join('\n')
    : 'لا توجد حركات حديثة لهذا التاجر.';
  return [
    `كشف مختصر للتاجر: ${merchant['اسم التاجر'] || '—'}`,
    `رقم التاجر: ${merchant['رقم التاجر'] || '—'}`,
    `رقم الحساب: ${merchant['رقم الحساب'] || '—'}`,
    `النشاط: ${merchant['اسم النشاط'] || '—'}`,
    `الهاتف: ${merchant['رقم الهاتف'] || '—'}`,
    `المنطقة: ${merchant['المنطقة'] || '—'}`,
    `عدد المكن المرتبط: ${machines.length}`,
    `إجمالي التحويلات: ${money(totalTransfers)}`,
    `إجمالي التحصيلات: ${money(totalCollections)}`,
    `المديونية الحالية: ${money(debt)}`,
    'آخر الحركات:',
    recentText
  ].join('\n');
}

function buildTopDebtors(context) {
  const ranked = (context.merchants || []).map(merchant => ({ merchant, ...calculateDebtForMerchant(merchant.id, context) }))
    .sort((a, b) => b.debt - a.debt)
    .filter(item => item.debt > 0)
    .slice(0, 5);
  if (!ranked.length) return 'لا توجد مديونيات حالية على التجار.';
  return 'أعلى 5 مديونيات حالياً:\n' + ranked.map((item, index) => `${index + 1}) ${item.merchant['اسم التاجر']} — ${money(item.debt)} — حساب ${item.merchant['رقم الحساب'] || '—'}`).join('\n');
}

function buildOverview(context) {
  const merchants = context.merchants || [];
  const machines = context.machines || [];
  const transfers = context.transfers || [];
  const collections = context.collections || [];
  const requests = context.requests || [];
  const totalTransfers = transfers.reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
  const totalCollections = collections.reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
  const pending = requests.filter(item => normalizeArabic(item['الحالة']) === 'معلق').length;
  return [
    'ملخص تنفيذي سريع:',
    `- عدد التجار: ${merchants.length}`,
    `- عدد المكن: ${machines.length}`,
    `- إجمالي التحويلات: ${money(totalTransfers)}`,
    `- إجمالي التحصيلات: ${money(totalCollections)}`,
    `- المديونية الإجمالية: ${money(Math.max(0, totalTransfers - totalCollections))}`,
    `- الطلبات المعلقة: ${pending}`
  ].join('\n');
}

export async function processQuery(question, context = {}) {
  const raw = String(question || '').trim();
  const q = normalizeArabic(question);
  if (!q) return 'اكتب سؤالك أولاً.';

  if (includesAny(q, ['مساعده', 'ساعدني', 'help', 'ايه اللي تقدر', 'ماذا تستطيع'])) {
    return [
      'أستطيع مساعدتك في:',
      '- ملخص تنفيذي للنظام',
      '- عدد التجار والمكن والطلبات المعلقة',
      '- إجمالي التحويلات والتحصيلات والمديونية',
      '- أعلى المديونيات',
      '- كشف مختصر لأي تاجر بالاسم أو رقم التاجر أو رقم الحساب',
      '- آخر الحركات الخاصة بأي تاجر'
    ].join('\n');
  }

  if (includesAny(q, ['ملخص', 'احصائيات', 'احصائيات النظام', 'لوحه', 'لوحة', 'overview'])) {
    return buildOverview(context);
  }

  if (includesAny(q, ['التجار', 'تاجر', 'عدد التجار', 'قائمه التجار', 'قائمة التجار']) && !includesAny(q, ['كشف', 'حساب', 'بيانات', 'تفاصيل'])) {
    const merchants = context.merchants || [];
    if (!merchants.length) return 'لا يوجد تجار حالياً.';
    const preview = merchants.slice().sort((a, b) => String(a['رقم التاجر'] || '').localeCompare(String(b['رقم التاجر'] || ''), 'en')).slice(0, 10).map((merchant, index) => `${index + 1}) ${merchant['رقم التاجر'] || '—'} - ${merchant['اسم التاجر'] || 'بدون اسم'} - ${merchant['رقم الحساب'] || 'بدون حساب'}`).join('\n');
    return `عدد التجار الحالي: ${merchants.length}\nأول 10 تجار في القائمة:\n${preview}`;
  }

  if (includesAny(q, ['المكن', 'مكينه', 'مكنه', 'عدد المكن', 'عدد المكينات'])) {
    return `عدد المكن الحالي: ${(context.machines || []).length}`;
  }

  if (includesAny(q, ['تحويل', 'التحويل', 'التحويلات', 'اجمالي التحويلات', 'إجمالي التحويلات'])) {
    const total = (context.transfers || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    return `إجمالي التحويلات الحالية: ${money(total)}`;
  }

  if (includesAny(q, ['تحصيل', 'التحصيل', 'التحصيلات', 'اجمالي التحصيلات', 'إجمالي التحصيلات'])) {
    const total = (context.collections || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
    return `إجمالي التحصيلات الحالية: ${money(total)}`;
  }

  if (includesAny(q, ['مديونيه', 'مديونيه', 'الرصيد', 'المتبقي', 'المستحق'])) {
    const totalTransfers = (context.transfers || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    const totalCollections = (context.collections || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
    return `المديونية الإجمالية الحالية: ${money(Math.max(0, totalTransfers - totalCollections))}`;
  }

  if (includesAny(q, ['طلبات', 'طلب', 'معلق', 'المعلقه', 'المعلقة'])) {
    const pending = (context.requests || []).filter(item => normalizeArabic(item['الحالة']) === 'معلق').length;
    return `عدد الطلبات المعلقة حالياً: ${pending}`;
  }

  if (includesAny(q, ['اكبر مديونيه', 'اعلى مديونيه', 'اعلي مديونيه', 'اعلى التجار', 'اكبر التجار'])) {
    return buildTopDebtors(context);
  }

  if (/^\d{4,}$/.test(raw) || includesAny(q, ['كشف', 'حساب', 'بيانات تاجر', 'تفاصيل تاجر', 'التاجر', 'حركات'])) {
    const merchant = detectMerchant(context, question);
    if (merchant) return buildMerchantStatement(merchant, context);
  }

  return [
    'لم أحدد المقصود بدقة.',
    'جرّب واحدة من الصيغ التالية:',
    '- ملخص النظام',
    '- إجمالي التحويلات',
    '- إجمالي التحصيلات',
    '- أعلى مديونية',
    '- كشف حساب التاجر أحمد',
    '- رقم الحساب 398442027'
  ].join('\n');
}

export async function processAiQuery(question, context = {}) {
  return processQuery(question, context);
}

export function initAIService() {
  supabase = window.supabaseClient || window.supabase || null;
}
