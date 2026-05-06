const SETTINGS_DEFAULTS = {
  company_name: 'Axentro',
  support_email: 'axentroofficial@gmail.com',
  support_phone: '+20 1146476993',
  qr_url: 'https://axentro-official.github.io/axentro-website/links.html',
  debt_warning: '15000',
  debt_danger: '50000',
  merchant_request_emails: 'axentroofficial@gmail.com',
  license_key: '',
  license_plan: 'lifetime',
  license_email: '',
  license_expires_at: '',
  license_status: 'active'
};

let supabase = null;
let settingsCache = { ...SETTINGS_DEFAULTS };

const fieldMap = {
  company_name: 'setting_company_name',
  support_email: 'setting_support_email',
  support_phone: 'setting_support_phone',
  qr_url: 'setting_qr_url',
  debt_warning: 'setting_debt_warning',
  debt_danger: 'setting_debt_danger',
  merchant_request_emails: 'setting_merchant_request_emails',
  license_key: 'setting_license_key',
  license_plan: 'setting_license_plan',
  license_email: 'setting_license_email',
  license_expires_at: 'setting_license_expires_at',
  license_status: 'setting_license_status'
};

function getClient() {
  supabase = supabase || window.supabaseClient;
  return supabase;
}

function normalizeRows(rows = []) {
  const result = { ...SETTINGS_DEFAULTS };
  rows.forEach(row => {
    const key = row.setting_key || row.key || row['المفتاح'] || row.name || row['الاسم'];
    let value = row.setting_value ?? row.value ?? row['القيمة'] ?? '';
    if (typeof value === 'string' && value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch (_) {}
    }
    if (key && Object.prototype.hasOwnProperty.call(result, key)) result[key] = String(value ?? '');
  });
  return result;
}

function fillForm(settings) {
  Object.entries(fieldMap).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.value = settings[key] ?? '';
  });
}

function readForm() {
  const out = {};
  Object.entries(fieldMap).forEach(([key, id]) => {
    out[key] = document.getElementById(id)?.value?.trim() || '';
  });
  return out;
}

export function getRuntimeSettings() {
  return { ...settingsCache };
}
window.getRuntimeSettings = getRuntimeSettings;

export async function applyRuntimeSettings() {
  const client = getClient();
  try {
    if (client) await loadSettings(true);
  } catch (_) {}
  const settings = getRuntimeSettings();
  document.querySelectorAll('.navbar-title').forEach(el => { el.textContent = `${settings.company_name || 'Axentro'} Admin`; });
  document.querySelectorAll('.footer-copyright').forEach(el => { el.textContent = `© ${new Date().getFullYear()} ${settings.company_name || 'Axentro'} – All Rights Reserved`; });
  document.querySelectorAll('.qr-link').forEach(a => { if (settings.qr_url) a.href = settings.qr_url; });
  document.querySelectorAll('.qr-img').forEach(img => {
    if (settings.qr_url) img.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(settings.qr_url)}&color=0a0f1e&bgcolor=ffffff`;
  });
  const banner = document.getElementById('licenseBanner');
  if (banner) banner.classList.toggle('show', !settings.license_key);
}

export async function loadSettings(silent = false) {
  const client = getClient();
  if (!client) return;
  try {
    const { data, error } = await client.from('settings').select('*');
    if (error) throw error;
    settingsCache = normalizeRows(data || []);
    fillForm(settingsCache);
    if (!silent) window.showToast?.('تم تحميل الإعدادات', 'success');
    return settingsCache;
  } catch (error) {
    console.warn('Settings load failed:', error);
    settingsCache = { ...SETTINGS_DEFAULTS };
    fillForm(settingsCache);
    if (!silent) window.showToast?.('تعذر تحميل الإعدادات. تأكد من تنفيذ SQL Phase 3.', 'warning');
    return settingsCache;
  }
}

export async function saveSettings() {
  const client = getClient();
  if (!client) return window.showToast?.('قاعدة البيانات غير جاهزة', 'error');
  const settings = readForm();
  try {
    const rows = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      'الخاصية': key,
      'القيمة': value,
      updated_at: new Date().toISOString()
    }));
    const { error } = await client.from('settings').upsert(rows, { onConflict: 'setting_key' });
    if (error) throw error;

    settingsCache = { ...SETTINGS_DEFAULTS, ...settings };
    await applyRuntimeSettings();
    await window.enforceLicenseGate?.();
    window.showToast?.('تم حفظ الإعدادات بنجاح', 'success');
  } catch (error) {
    console.error('Settings save failed:', error);
    window.showToast?.('تعذر حفظ الإعدادات. تأكد من تنفيذ SQL الخاص بالتراخيص والإعدادات.', 'error');
  }
}

export function initSettingsPage() {
  supabase = window.supabaseClient;
}
