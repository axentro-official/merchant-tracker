import { normalizeText } from '../utils/formatters.js';

function currentYearSuffix() {
  return String(new Date().getFullYear()).slice(-2);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSequenceFromCode(code, { prefix, year = currentYearSuffix() }) {
  const value = String(code || '').trim();
  if (!value) return 0;
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-${escapeRegExp(year)}-(\\d+)$`, 'i');
  const match = value.match(pattern);
  if (match) return parseInt(match[1], 10) || 0;
  const fallback = value.match(/(\d+)(?!.*\d)/);
  return fallback ? parseInt(fallback[1], 10) || 0 : 0;
}

export async function generateNextCode(supabase, tableName, columnName, { prefix, pad = 3, year = currentYearSuffix() }) {
  const { data, error } = await supabase.from(tableName).select(`"${columnName}"`);
  if (error) throw error;

  const next = (data || []).reduce((max, row) => {
    const value = row?.[columnName];
    return Math.max(max, extractSequenceFromCode(value, { prefix, year }));
  }, 0) + 1;

  return `${prefix}-${year}-${String(next).padStart(pad, '0')}`;
}

export async function generateUniqueCodeWithRetry(supabase, tableName, columnName, config, maxRetries = 4) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateNextCode(supabase, tableName, columnName, config);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('تعذر توليد الكود التالي');
}

export function buildMerchantLabel(merchant) {
  const merchantCode = merchant?.['رقم التاجر'] || '—';
  const merchantName = merchant?.['اسم التاجر'] || 'بدون اسم';
  const activity = merchant?.['اسم النشاط'] || 'غير محدد';
  const accountNumber = merchant?.['رقم الحساب'] || 'بدون حساب';
  return `${merchantCode} - ${merchantName} - ${activity} - ${accountNumber}`;
}

export function matchMerchantAgainstTerm(merchant, term) {
  const raw = String(term || '').trim();
  const normalized = normalizeText(raw);
  const fields = [
    merchant?.['رقم التاجر'],
    merchant?.['اسم التاجر'],
    merchant?.['اسم النشاط'],
    merchant?.['رقم الحساب'],
    merchant?.['رقم الهاتف'],
    merchant?.['المنطقة'],
    buildMerchantLabel(merchant)
  ];
  return fields.some(value => normalizeText(value).includes(normalized)) || String(merchant?.['رقم التاجر'] || '') === raw;
}

export function filterMerchants(merchants, term) {
  const normalized = normalizeText(term);
  if (!normalized) return [...(merchants || [])];
  return (merchants || []).filter(merchant => matchMerchantAgainstTerm(merchant, term));
}

export function buildMachineOptionLabel(machine) {
  const machineCode = machine?.['رقم المكنة'] || '—';
  const serial = machine?.['الرقم التسلسلي'] || 'بدون سيريال';
  const status = machine?.['الحالة'] || '—';
  return `${machineCode} - ${serial} - ${status}`;
}


export function sortMerchantsByCode(merchants = []) {
  return [...merchants].sort((a, b) => {
    const aSeq = extractSequenceFromCode(a?.['رقم التاجر'], { prefix: 'MER' });
    const bSeq = extractSequenceFromCode(b?.['رقم التاجر'], { prefix: 'MER' });
    if (aSeq !== bSeq) return aSeq - bSeq;
    return String(a?.['اسم التاجر'] || '').localeCompare(String(b?.['اسم التاجر'] || ''), 'ar');
  });
}

export function sortMachinesByCode(machines = []) {
  return [...machines].sort((a, b) => {
    const aSeq = extractSequenceFromCode(a?.['رقم المكنة'], { prefix: 'MAC' });
    const bSeq = extractSequenceFromCode(b?.['رقم المكنة'], { prefix: 'MAC' });
    if (aSeq !== bSeq) return aSeq - bSeq;
    return String(a?.['الرقم التسلسلي'] || '').localeCompare(String(b?.['الرقم التسلسلي'] || ''), 'en');
  });
}

function extractMissingColumn(error) {
  const message = String(error?.message || '');
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column\s+[^.]+\.([^\s'"`]+)\s+does not exist/i,
    /column\s+"([^"]+)"\s+does not exist/i
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

export async function safeMutateRecord(supabase, tableName, payload, { id = '', maxRetries = 8 } = {}) {
  let currentPayload = { ...(payload || {}) };
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const query = id
      ? supabase.from(tableName).update(currentPayload).eq('id', id)
      : supabase.from(tableName).insert([currentPayload]);

    const { error } = await query;
    if (!error) return { ok: true, payload: currentPayload };

    lastError = error;
    const missingColumn = extractMissingColumn(error);
    if (!missingColumn || !(missingColumn in currentPayload)) {
      break;
    }

    delete currentPayload[missingColumn];
  }

  throw lastError || new Error('فشل تنفيذ العملية على قاعدة البيانات');
}

export function sortRowsByDateTime(rows = [], dateKey = 'التاريخ', timeKey = 'الوقت') {
  const parseValue = row => {
    const date = String(row?.[dateKey] || '').trim();
    const time = String(row?.[timeKey] || '').trim() || '12:00 AM';
    const value = new Date(`${date} ${time}`).getTime();
    return Number.isFinite(value) ? value : 0;
  };
  return [...rows].sort((a, b) => parseValue(b) - parseValue(a));
}
