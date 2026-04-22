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
