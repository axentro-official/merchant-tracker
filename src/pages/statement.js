import { showToast } from '../ui/toast.js';
import { formatDate, formatTime, formatMoney, escapeHtml } from '../utils/formatters.js';

let supabase = null;
let merchantsList = [];

export function initStatementPage() {
  supabase = window.supabaseClient;
}

function normalizeArabic(text) {
  return String(text || '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getMerchantById(id) {
  return merchantsList.find(m => m.id === id);
}

function renderMerchantInfo(merchant) {
  const infoEl = document.getElementById('statementMerchantInfo');
  if (!infoEl) return;

  if (!merchant) {
    infoEl.innerHTML = '';
    return;
  }

  infoEl.innerHTML = `
    <div class="stat-card" style="margin: 16px 0;">
      <div class="stat-card-header">
        <div class="stat-card-title">بيانات التاجر</div>
        <div class="stat-card-icon blue"><i class="fas fa-user"></i></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
        <div><strong>رقم التاجر:</strong> ${escapeHtml(merchant['رقم التاجر'] || '-')}</div>
        <div><strong>اسم التاجر:</strong> ${escapeHtml(merchant['اسم التاجر'] || '-')}</div>
        <div><strong>اسم النشاط:</strong> ${escapeHtml(merchant['اسم النشاط'] || '-')}</div>
        <div><strong>رقم الحساب:</strong> ${escapeHtml(merchant['رقم الحساب'] || '-')}</div>
      </div>
    </div>
  `;
}

function renderStatementStats(totalTransfers, totalCollections, balance, rowCount) {
  const statsEl = document.getElementById('statementStats');
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="dashboard-grid" style="margin-bottom:16px;">
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-title">عدد الحركات</div>
          <div class="stat-card-icon blue"><i class="fas fa-list"></i></div>
        </div>
        <div class="stat-card-value">${rowCount.toLocaleString('ar-EG')}</div>
        <div class="stat-card-label">إجمالي المعاملات</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-title">إجمالي التحويلات</div>
          <div class="stat-card-icon purple"><i class="fas fa-arrow-up"></i></div>
        </div>
        <div class="stat-card-value">${formatMoney(totalTransfers)}</div>
        <div class="stat-card-label">مدين</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-title">إجمالي التحصيلات</div>
          <div class="stat-card-icon green"><i class="fas fa-arrow-down"></i></div>
        </div>
        <div class="stat-card-value">${formatMoney(totalCollections)}</div>
        <div class="stat-card-label">دائن</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-title">الرصيد الحالي</div>
          <div class="stat-card-icon red"><i class="fas fa-balance-scale"></i></div>
        </div>
        <div class="stat-card-value">${formatMoney(balance)}</div>
        <div class="stat-card-label">متبقي فعلي</div>
      </div>
    </div>
  `;
}

export async function loadMerchantsForStatement() {
  supabase = supabase || window.supabaseClient;
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    merchantsList = data || [];

    const datalist = document.getElementById('merchantDatalistStmt');
    if (datalist) {
      datalist.innerHTML = merchantsList.map(m =>
        `<option value="${escapeHtml(m['رقم التاجر'])}">${escapeHtml(m['رقم التاجر'])} - ${escapeHtml(m['اسم التاجر'])}</option>`
      ).join('');
    }

    const search = document.getElementById('stmtMerchantSearch');
    const hidden = document.getElementById('stmtMerchantId');

    if (search && hidden) {
      search.onchange = search.oninput = () => {
        const raw = search.value || '';
        const normalizedInput = normalizeArabic(raw);

        const merchant = merchantsList.find(x => {
          const code = String(x['رقم التاجر'] || '');
          const name = String(x['اسم التاجر'] || '');
          const full = `${code} - ${name}`;

          return (
            code === raw ||
            full === raw ||
            normalizeArabic(code) === normalizedInput ||
            normalizeArabic(name).includes(normalizedInput) ||
            normalizeArabic(full).includes(normalizedInput)
          );
        });

        hidden.value = merchant?.id || '';
      };
    }
  } catch (err) {
    console.error(err);
    showToast('خطأ في تحميل قائمة التجار', 'error');
  }
}

export async function loadStatement() {
  supabase = supabase || window.supabaseClient;

  const merchantId = document.getElementById('stmtMerchantId')?.value;
  const tbody = document.getElementById('statementTableBody');

  if (!tbody) return;

  if (!merchantId) {
    showToast('يرجى اختيار تاجر من القائمة', 'warning');
    return;
  }

  try {
    const merchant = getMerchantById(merchantId);
    renderMerchantInfo(merchant);

    const [transfersRes, collectionsRes] = await Promise.all([
      supabase
        .from('transfers')
        .select('*')
        .eq('رقم التاجر', merchantId)
        .order('created_at', { ascending: true }),

      supabase
        .from('collections')
        .select('*')
        .eq('رقم التاجر', merchantId)
        .order('created_at', { ascending: true })
    ]);

    if (transfersRes.error) throw transfersRes.error;
    if (collectionsRes.error) throw collectionsRes.error;

    const rows = [];

    (transfersRes.data || []).forEach(t => {
      rows.push({
        kind: 'debit',
        type: 'تحويل',
        date: t['التاريخ'],
        time: t['الوقت'],
        ref: t['الرقم المرجعي'],
        amount: parseFloat(t['قيمة التحويل']) || 0,
        note: t['ملاحظات'] || '',
        createdAt: t.created_at || ''
      });
    });

    (collectionsRes.data || []).forEach(c => {
      rows.push({
        kind: 'credit',
        type: 'تحصيل',
        date: c['التاريخ'],
        time: c['الوقت'],
        ref: c['الرقم المرجعي'],
        amount: parseFloat(c['قيمة التحصيل']) || 0,
        note: c['ملاحظات'] || '',
        createdAt: c.created_at || ''
      });
    });

    rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (!rows.length) {
      renderStatementStats(0, 0, 0, 0);
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">لا توجد حركة لهذا التاجر</td></tr>';
      return;
    }

    let runningBalance = 0;
    let totalTransfers = 0;
    let totalCollections = 0;

    const renderedRows = rows.map((r, idx) => {
      const balanceBefore = runningBalance;

      if (r.kind === 'debit') {
        runningBalance += r.amount;
        totalTransfers += r.amount;
      } else {
        runningBalance -= r.amount;
        totalCollections += r.amount;
      }

      const balanceAfter = runningBalance;
      const noteText = [
        r.ref ? `مرجع: ${r.ref}` : '',
        r.note || '',
        `قبل: ${formatMoney(balanceBefore)}`,
        `بعد: ${formatMoney(balanceAfter)}`
      ].filter(Boolean).join(' | ');

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${formatDate(r.date)}</td>
          <td>${formatTime(r.time || '-')}</td>
          <td>${escapeHtml(r.type)}</td>
          <td>${formatMoney(r.amount)}</td>
          <td><strong>${formatMoney(balanceAfter)}</strong></td>
          <td>${escapeHtml(noteText)}</td>
        </tr>
      `;
    });

    renderStatementStats(totalTransfers, totalCollections, runningBalance, rows.length);
    tbody.innerHTML = renderedRows.join('');
  } catch (err) {
    console.error(err);
    showToast('حدث خطأ أثناء تحميل كشف الحساب', 'error');
  }
}
