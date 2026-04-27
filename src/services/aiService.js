let supabase = null;

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
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[_.,:;!?؟،()\[\]{}]/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function safeNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function includesAny(text, terms = []) {
  const source = normalizeArabic(text);
  return terms.some(term => source.includes(normalizeArabic(term)));
}

function rowDateValue(row) {
  const ts = new Date(`${row?.['التاريخ'] || ''} ${row?.['الوقت'] || '12:00 AM'}`).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function merchantKeys(merchant = {}) {
  return [merchant.id, merchant['رقم التاجر'], merchant['رقم الحساب'], merchant['اسم التاجر']]
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .map(v => String(v).trim());
}

function isRelatedToMerchant(row = {}, merchant = {}) {
  const keys = merchantKeys(merchant);
  const rowValues = [row['رقم التاجر'], row['رقم الحساب'], row['اسم التاجر']]
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .map(v => String(v).trim());
  return rowValues.some(value => keys.includes(value));
}

function tokenize(text) {
  return normalizeArabic(text).split(' ').filter(Boolean);
}

function detectMerchant(context, question) {
  const raw = String(question || '').trim();
  const q = normalizeArabic(question);
  const ignored = ['كشف','حساب','التاجر','تاجر','بيانات','تفاصيل','مديونيه','تحويلات','تحصيلات','رقم','عن'];
  const tokens = tokenize(question).filter(t => !ignored.includes(t));
  const candidates = (context.merchants || []).map(merchant => {
    const fields = [merchant.id, merchant['اسم التاجر'], merchant['رقم التاجر'], merchant['رقم الحساب'], merchant['اسم النشاط'], merchant['رقم الهاتف']];
    let score = 0;
    for (const field of fields) {
      const original = String(field || '').trim();
      const normalized = normalizeArabic(original);
      if (!normalized) continue;
      if (original === raw) score += 30;
      if (normalized === q) score += 24;
      if (q.includes(normalized) && normalized.length > 2) score += 14;
      if (normalized.includes(q) && q.length > 2) score += 10;
      for (const token of tokens) {
        if (token.length > 1 && normalized.includes(token)) score += 3;
      }
    }
    return { merchant, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.merchant || null;
}

function getMerchantMachines(merchant, context) {
  const keys = merchantKeys(merchant);
  return (context.machines || []).filter(machine => {
    const values = [machine['رقم التاجر'], machine['رقم الحساب'], machine['اسم التاجر']]
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v).trim());
    return values.some(v => keys.includes(v));
  });
}

function getMerchantTransactions(merchant, context) {
  const transfers = (context.transfers || []).filter(row => isRelatedToMerchant(row, merchant));
  const collections = (context.collections || []).filter(row => isRelatedToMerchant(row, merchant));
  const requests = (context.requests || []).filter(row => isRelatedToMerchant(row, merchant));
  const totalTransfers = transfers.reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
  const totalCollections = collections.reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
  return { transfers, collections, requests, totalTransfers, totalCollections, debt: Math.max(0, totalTransfers - totalCollections) };
}

function buildDebtors(context, limit = 0) {
  const rows = (context.merchants || []).map(merchant => ({ merchant, ...getMerchantTransactions(merchant, context) }))
    .filter(row => row.totalTransfers > 0 && row.debt > 0)
    .sort((a, b) => b.debt - a.debt);
  return limit ? rows.slice(0, limit) : rows;
}

function buildAllDebtorsAnswer(context) {
  const rows = buildDebtors(context);
  if (!rows.length) return 'لا توجد مديونيات حالية لتجار لديهم تحويلات.';
  const totalDebt = rows.reduce((sum, row) => sum + row.debt, 0);
  return [
    `إجمالي المتبقي الحالي: ${money(totalDebt)}`,
    `عدد التجار أصحاب المديونية: ${rows.length}`,
    'تفصيل التجار:',
    ...rows.map((row, index) => `${index + 1}) ${row.merchant['اسم التاجر'] || '—'} — حساب ${row.merchant['رقم الحساب'] || '—'} — تحويلات ${money(row.totalTransfers)} — تحصيلات ${money(row.totalCollections)} — المتبقي ${money(row.debt)}`)
  ].join('\n');
}

function buildMerchantStatement(merchant, context) {
  const machines = getMerchantMachines(merchant, context);
  const stats = getMerchantTransactions(merchant, context);
  const recent = [
    ...stats.transfers.map(row => ({ kind: 'تحويل', ref: row['الرقم المرجعي'] || '—', type: row['نوع التحويل'] || '—', amount: safeNumber(row['قيمة التحويل']), machine: row['رقم المكنة'] || '—', date: row['التاريخ'] || '', time: row['الوقت'] || '', sort: rowDateValue(row) })),
    ...stats.collections.map(row => ({ kind: 'تحصيل', ref: row['الرقم المرجعي'] || '—', type: row['نوع التحصيل'] || '—', amount: safeNumber(row['قيمة التحصيل']), machine: row['رقم المكنة'] || '—', date: row['التاريخ'] || '', time: row['الوقت'] || '', sort: rowDateValue(row) }))
  ].sort((a, b) => b.sort - a.sort).slice(0, 7);
  const pendingRequests = stats.requests.filter(row => normalizeArabic(row['الحالة']) === 'معلق').length;
  return [
    `كشف مختصر للتاجر: ${merchant['اسم التاجر'] || '—'}`,
    `رقم التاجر: ${merchant['رقم التاجر'] || '—'}`,
    `رقم الحساب: ${merchant['رقم الحساب'] || '—'}`,
    `النشاط: ${merchant['اسم النشاط'] || '—'}`,
    `الهاتف: ${merchant['رقم الهاتف'] || '—'}`,
    `المنطقة: ${merchant['المنطقة'] || '—'}`,
    `عدد المكن: ${machines.length}`,
    `إجمالي التحويلات: ${money(stats.totalTransfers)}`,
    `إجمالي التحصيلات: ${money(stats.totalCollections)}`,
    `المديونية الحالية: ${money(stats.debt)}`,
    `الطلبات المعلقة: ${pendingRequests}`,
    'آخر الحركات:',
    recent.length ? recent.map((row, index) => `${index + 1}) ${row.kind} • ${row.type} • ${money(row.amount)} • مرجع ${row.ref} • مكنة ${row.machine} • ${row.date} ${row.time}`).join('\n') : 'لا توجد حركات حديثة لهذا التاجر.'
  ].join('\n');
}

function buildMerchantFocusedAnswer(merchant, context, question) {
  const q = normalizeArabic(question);
  const machines = getMerchantMachines(merchant, context);
  const stats = getMerchantTransactions(merchant, context);
  if (includesAny(q, ['مكن', 'مكينه', 'مكنه', 'ماكينات', 'سيريال', 'serial'])) {
    if (!machines.length) return `لا توجد مكن مرتبطة بالتاجر ${merchant['اسم التاجر'] || '—'}.`;
    return `المكن المرتبطة بالتاجر ${merchant['اسم التاجر'] || '—'}:\n` + machines.map((machine, index) => `${index + 1}) رقم المكنة: ${machine['رقم المكنة'] || '—'} • السيريال: ${machine['الرقم التسلسلي'] || '—'} • الحالة: ${machine['الحالة'] || '—'} • التارجت: ${money(machine['التارجت الشهري'])}`).join('\n');
  }
  if (includesAny(q, ['تحويل', 'التحويلات'])) {
    const latest = stats.transfers.slice().sort((a,b) => rowDateValue(b) - rowDateValue(a)).slice(0, 5);
    return [`إجمالي تحويلات ${merchant['اسم التاجر'] || '—'}: ${money(stats.totalTransfers)}`, `عدد التحويلات: ${stats.transfers.length}`, latest.length ? 'آخر التحويلات:\n' + latest.map((row, i) => `${i+1}) ${row['الرقم المرجعي'] || '—'} • ${money(row['قيمة التحويل'])} • ${row['التاريخ'] || '—'} ${row['الوقت'] || ''}`).join('\n') : 'لا توجد تحويلات.'].join('\n');
  }
  if (includesAny(q, ['تحصيل', 'التحصيلات'])) {
    const latest = stats.collections.slice().sort((a,b) => rowDateValue(b) - rowDateValue(a)).slice(0, 5);
    return [`إجمالي تحصيلات ${merchant['اسم التاجر'] || '—'}: ${money(stats.totalCollections)}`, `عدد التحصيلات: ${stats.collections.length}`, latest.length ? 'آخر التحصيلات:\n' + latest.map((row, i) => `${i+1}) ${row['الرقم المرجعي'] || '—'} • ${money(row['قيمة التحصيل'])} • ${row['التاريخ'] || '—'} ${row['الوقت'] || ''}`).join('\n') : 'لا توجد تحصيلات.'].join('\n');
  }
  if (includesAny(q, ['طلب', 'طلبات', 'معلق', 'المعلقه', 'المعلقة'])) {
    const pending = stats.requests.filter(row => normalizeArabic(row['الحالة']) === 'معلق');
    return [`طلبات ${merchant['اسم التاجر'] || '—'}: ${stats.requests.length}`, `الطلبات المعلقة: ${pending.length}`, pending.length ? pending.slice(0, 5).map((row, i) => `${i+1}) ${row['رقم الطلب'] || '—'} • ${row['نوع الطلب'] || '—'} • ${money(row['المبلغ'])}`).join('\n') : 'لا توجد طلبات معلقة.'].join('\n');
  }
  if (includesAny(q, ['مديونيه', 'رصيد', 'مستحق', 'متبقي'])) {
    return `مديونية ${merchant['اسم التاجر'] || '—'} الحالية: ${money(stats.debt)}\nإجمالي التحويلات: ${money(stats.totalTransfers)}\nإجمالي التحصيلات: ${money(stats.totalCollections)}`;
  }
  return buildMerchantStatement(merchant, context);
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
  const activeMerchants = merchants.filter(item => ['نشط','نشطة'].includes(String(item['الحالة'] || '').trim())).length;
  return [
    'ملخص تنفيذي سريع:',
    `- عدد التجار: ${merchants.length}`,
    `- التجار النشطون: ${activeMerchants}`,
    `- عدد المكن: ${machines.length}`,
    `- إجمالي التحويلات: ${money(totalTransfers)}`,
    `- إجمالي التحصيلات: ${money(totalCollections)}`,
    `- إجمالي المتبقي: ${money(Math.max(0, totalTransfers - totalCollections))}`,
    `- الطلبات المعلقة: ${pending}`
  ].join('\n');
}

function buildTopMachines(context) {
  const machines = context.machines || [];
  const transfers = context.transfers || [];
  if (!machines.length) return 'لا توجد مكن مسجلة.';
  const rows = machines.map(machine => {
    const achieved = transfers.filter(row => String(row['رقم المكنة'] || '') === String(machine['رقم المكنة'] || '') || (!row['رقم المكنة'] && String(row['رقم التاجر']) === String(machine['رقم التاجر']))).reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    const target = safeNumber(machine['التارجت الشهري']);
    const pct = target > 0 ? (achieved / target) * 100 : 0;
    return { machine, achieved, target, pct };
  }).sort((a,b) => b.pct - a.pct || b.achieved - a.achieved).slice(0, 10);
  return 'أعلى المكن أداءً:\n' + rows.map((row, i) => `${i+1}) ${row.machine['رقم المكنة'] || '—'} • ${row.machine['اسم التاجر'] || '—'} • محقق ${money(row.achieved)} من ${money(row.target)} • ${row.pct.toFixed(1)}%`).join('\n');
}

function buildHelp() {
  return [
    'أنا مساعد Axentro الذكي. أقدر أساعدك في:',
    '- ملخص النظام',
    '- إجمالي المتبقي مع أسماء التجار تاجر تاجر',
    '- إجمالي التحويلات أو التحصيلات',
    '- أعلى مديونية وأعلى مكن أداءً',
    '- كشف حساب تاجر بالاسم أو رقم الحساب أو رقم التاجر',
    '- مكن تاجر معين وطلباته المعلقة',
    '',
    'أمثلة:',
    'ملخص النظام',
    'إجمالي المتبقي',
    'كشف حساب أحمد',
    'رقم الحساب 2468',
    'أعلى مديونية',
    'أعلى المكن'
  ].join('\n');
}

export async function processQuery(question, context = {}) {
  const raw = String(question || '').trim();
  const q = normalizeArabic(raw);
  if (!q) return 'اكتب سؤالك أولاً.';
  if (includesAny(q, ['اهلا', 'اهلاً', 'مرحبا', 'السلام عليكم', 'هاي', 'hello', 'hi'])) {
    return 'مرحباً بك. أنا مساعد Axentro الذكي. اسألني عن الملخص، المتبقي، التحويلات، التحصيلات، أعلى مديونية، أو كشف حساب أي تاجر.';
  }
  if (includesAny(q, ['مساعده', 'ساعدني', 'help', 'ايه اللي تقدر', 'ماذا تستطيع', 'تعمل ايه', 'اوامر'])) return buildHelp();
  const merchant = detectMerchant(context, raw);
  if (merchant && includesAny(q, ['كشف', 'حساب', 'بيانات', 'تفاصيل', 'حركات', 'تحويل', 'تحصيل', 'مديونيه', 'رصيد', 'مستحق', 'متبقي', 'مكن', 'مكينه', 'مكنه', 'طلبات', 'طلب'])) return buildMerchantFocusedAnswer(merchant, context, raw);
  if (includesAny(q, ['اجمالي المتبقي', 'إجمالي المتبقي', 'المتبقي ايه', 'كل المتبقي', 'المديونيه كلها', 'المديونيه الاجماليه', 'الرصيد المستحق', 'المستحقين'])) return buildAllDebtorsAnswer(context);
  if (includesAny(q, ['اكبر مديونيه', 'اعلى مديونيه', 'اعلي مديونيه', 'اعلى التجار', 'اكبر التجار'])) {
    const rows = buildDebtors(context, 10);
    if (!rows.length) return 'لا توجد مديونيات حالية.';
    return 'أعلى المديونيات حالياً:\n' + rows.map((row, index) => `${index + 1}) ${row.merchant['اسم التاجر'] || '—'} — ${money(row.debt)} — حساب ${row.merchant['رقم الحساب'] || '—'}`).join('\n');
  }
  if (includesAny(q, ['ملخص', 'احصائيات', 'احصائيات النظام', 'لوحه', 'لوحة', 'overview', 'system'])) return buildOverview(context);
  if (includesAny(q, ['اعلى المكن', 'افضل المكن', 'اداء المكن', 'التارجت'])) return buildTopMachines(context);
  if (includesAny(q, ['التجار', 'عدد التجار', 'قائمه التجار', 'قائمة التجار']) && !merchant) {
    const merchants = context.merchants || [];
    if (!merchants.length) return 'لا يوجد تجار حالياً.';
    const preview = merchants.slice().sort((a, b) => String(a['رقم التاجر'] || '').localeCompare(String(b['رقم التاجر'] || ''), 'en')).slice(0, 15).map((m, i) => `${i + 1}) ${m['اسم التاجر'] || 'بدون اسم'} — ${m['رقم التاجر'] || '—'} — حساب ${m['رقم الحساب'] || '—'} — ${m['الحالة'] || '—'}`).join('\n');
    return `عدد التجار الحالي: ${merchants.length}\nأول 15 تاجر:\n${preview}`;
  }
  if (includesAny(q, ['المكن', 'مكينه', 'مكنه', 'عدد المكن', 'عدد المكينات'])) return `عدد المكن الحالي: ${(context.machines || []).length}`;
  if (includesAny(q, ['تحويل', 'التحويل', 'التحويلات', 'اجمالي التحويلات'])) {
    const total = (context.transfers || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحويل']), 0);
    return `إجمالي التحويلات الحالية: ${money(total)}\nعدد التحويلات: ${(context.transfers || []).length}`;
  }
  if (includesAny(q, ['تحصيل', 'التحصيل', 'التحصيلات', 'اجمالي التحصيلات'])) {
    const total = (context.collections || []).reduce((sum, row) => sum + safeNumber(row['قيمة التحصيل']), 0);
    return `إجمالي التحصيلات الحالية: ${money(total)}\nعدد التحصيلات: ${(context.collections || []).length}`;
  }
  if (includesAny(q, ['طلبات', 'طلب', 'معلق', 'المعلقه', 'المعلقة'])) {
    const pending = (context.requests || []).filter(item => normalizeArabic(item['الحالة']) === 'معلق');
    return `عدد الطلبات المعلقة حالياً: ${pending.length}` + (pending.length ? '\n' + pending.slice(0, 10).map((row, i) => `${i+1}) ${row['رقم الطلب'] || '—'} • ${row['اسم التاجر'] || '—'} • ${row['نوع الطلب'] || '—'} • ${money(row['المبلغ'])}`).join('\n') : '');
  }
  if (/^\d{3,}$/.test(raw) || includesAny(q, ['كشف', 'حساب', 'بيانات تاجر', 'تفاصيل تاجر', 'التاجر', 'حركات'])) {
    if (merchant) return buildMerchantStatement(merchant, context);
  }
  return ['لم أحدد المقصود بدقة.', 'جرّب صيغة مباشرة مثل:', '- ملخص النظام', '- إجمالي المتبقي', '- إجمالي التحويلات', '- إجمالي التحصيلات', '- أعلى مديونية', '- كشف حساب أحمد', '- رقم الحساب 2468'].join('\n');
}

export async function processAiQuery(question, context = {}) {
  return processQuery(question, context);
}

export function initAIService() {
  supabase = window.supabaseClient || window.supabase || null;
}
