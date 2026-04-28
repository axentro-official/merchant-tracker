const PLAN_LABELS = {
  trial: 'تجريبي',
  monthly: 'شهري',
  yearly: 'سنوي',
  lifetime: 'مدى الحياة'
};

function todayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function dateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(value) {
  const end = dateOnly(value);
  if (!end) return null;
  return Math.ceil((end.getTime() - todayStart().getTime()) / 86400000);
}

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['active', 'trial', 'نشط', 'تجريبي'].includes(raw)) return 'active';
  if (['expired', 'منتهي'].includes(raw)) return 'expired';
  if (['disabled', 'stopped', 'موقوف', 'معطل'].includes(raw)) return 'disabled';
  return raw || 'active';
}

function buildResult(record, fallbackKey = '') {
  const licenseKey = record?.license_key || fallbackKey || '';
  const plan = record?.plan_type || record?.license_plan || 'lifetime';
  const status = normalizeStatus(record?.status || record?.license_status || 'active');
  const endDate = record?.end_date || record?.license_expires_at || '';
  const remaining = daysUntil(endDate);

  if (!licenseKey) {
    return { valid: false, licenseKey: '', reason: 'missing', message: 'النسخة غير مفعلة. أدخل License Key صالح.' };
  }
  if (status === 'disabled') {
    return { valid: false, licenseKey, plan, status, endDate, reason: 'disabled', message: 'هذا الترخيص موقوف.' };
  }
  if (status === 'expired') {
    return { valid: false, licenseKey, plan, status, endDate, reason: 'expired', message: 'انتهت صلاحية الترخيص.' };
  }
  if (plan !== 'lifetime') {
    if (!endDate) {
      return { valid: false, licenseKey, plan, status, reason: 'missing_end_date', message: 'الترخيص غير مكتمل: تاريخ الانتهاء غير موجود.' };
    }
    if (remaining < 0) {
      return { valid: false, licenseKey, plan, status: 'expired', endDate, remainingDays: remaining, reason: 'expired', message: 'انتهت صلاحية الترخيص.' };
    }
  }

  const warning = plan !== 'lifetime' && remaining !== null && remaining <= 7;
  return {
    valid: true,
    licenseKey,
    plan,
    planLabel: PLAN_LABELS[plan] || plan,
    status: 'active',
    endDate,
    remainingDays: remaining,
    warning,
    message: warning ? `تنبيه: الترخيص سينتهي بعد ${remaining} يوم.` : 'الترخيص صالح.'
  };
}

export async function verifyCurrentLicense(supabase, settings = {}) {
  const licenseKey = String(settings.license_key || '').trim();
  if (!licenseKey) return buildResult(null, '');

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return buildResult({ license_key: licenseKey, status: 'disabled' }, licenseKey);
    }
    return buildResult(data, licenseKey);
  } catch (error) {
    // Backward-compatible fallback: old projects that only have settings. Still locked if no key.
    return buildResult({
      license_key: licenseKey,
      plan_type: settings.license_plan || 'lifetime',
      status: settings.license_status || 'active',
      end_date: settings.license_expires_at || ''
    }, licenseKey);
  }
}

export async function activateLicense(supabase, licenseKey) {
  const key = String(licenseKey || '').trim();
  if (!key) return buildResult(null, '');

  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { valid: false, licenseKey: key, reason: 'not_found', message: 'License Key غير موجود.' };

  const result = buildResult(data, key);
  if (!result.valid) return result;

  const settingsRows = [
    ['license_key', key],
    ['license_plan', data.plan_type || 'lifetime'],
    ['license_email', data.client_email || ''],
    ['license_status', data.status || 'active'],
    ['license_expires_at', data.end_date || '']
  ].map(([setting_key, setting_value]) => ({ setting_key, setting_value, 'الخاصية': setting_key, 'القيمة': setting_value, updated_at: new Date().toISOString() }));

  const { error: settingsError } = await supabase
    .from('settings')
    .upsert(settingsRows, { onConflict: 'setting_key' });
  if (settingsError) throw settingsError;

  await supabase.from('licenses').update({ activated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('license_key', key);
  return result;
}

export function renderLicenseState(result) {
  if (!result) return 'لم يتم التحقق من الترخيص.';
  const cls = result.valid ? (result.warning ? 'warning' : 'active') : 'danger';
  const icon = result.valid ? (result.warning ? 'fa-triangle-exclamation' : 'fa-circle-check') : 'fa-circle-xmark';
  const plan = result.planLabel || PLAN_LABELS[result.plan] || result.plan || 'غير محدد';
  const end = result.plan === 'lifetime' ? 'مدى الحياة' : (result.endDate || 'غير محدد');
  return `
    <div class="license-badge ${cls}"><i class="fas ${icon}"></i> ${result.message || ''}</div>
    <div style="margin-top:10px;line-height:1.9">
      <strong>المفتاح:</strong> ${result.licenseKey || '—'}<br>
      <strong>النوع:</strong> ${plan}<br>
      <strong>الانتهاء:</strong> ${end}
    </div>
  `;
}
