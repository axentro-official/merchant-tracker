import { escapeHtml } from '../utils/formatters.js';

let supabase = null;
let latestRows = [];

function getClient() {
  supabase = supabase || window.supabaseClient;
  return supabase;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value).replace(/\r?\n/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function render(rows) {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-inbox"></i> لا توجد سجلات مطابقة</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(row['التاريخ'] || String(row.created_at || '').slice(0, 10) || '—')}</td>
      <td>${escapeHtml(row['الوقت'] || String(row.created_at || '').slice(11, 19) || '—')}</td>
      <td><span class="badge badge-info">${escapeHtml(row['النوع'] || '—')}</span></td>
      <td><code class="ref-code">${escapeHtml(row['الرقم المرجعي'] || '—')}</code></td>
      <td>${escapeHtml(row['التفاصيل'] || '—')}</td>
      <td>${escapeHtml(row['المستخدم'] || 'النظام')}</td>
    </tr>`).join('');
}

function applyFilters(rows) {
  const from = document.getElementById('logsFromDate')?.value || '';
  const to = document.getElementById('logsToDate')?.value || '';
  const type = document.getElementById('logsType')?.value || '';
  const search = (document.getElementById('logsSearch')?.value || '').trim().toLowerCase();
  return rows.filter(row => {
    const d = row['التاريخ'] || String(row.created_at || '').slice(0, 10);
    const haystack = `${row['النوع'] || ''} ${row['الرقم المرجعي'] || ''} ${row['التفاصيل'] || ''} ${row['المستخدم'] || ''}`.toLowerCase();
    return (!from || d >= from) && (!to || d <= to) && (!type || haystack.includes(type.toLowerCase())) && (!search || haystack.includes(search));
  });
}

export async function loadLogs() {
  const client = getClient();
  const tbody = document.getElementById('logsTableBody');
  if (!client || !tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> جاري تحميل السجل...</td></tr>';
  try {
    const { data, error } = await client.from('logs').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    latestRows = data || [];
    render(applyFilters(latestRows));
  } catch (error) {
    console.error('Logs load failed:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i> تعذر تحميل السجل</td></tr>';
  }
}

export function exportLogsCSV() {
  const rows = applyFilters(latestRows);
  if (!rows.length) return window.showToast?.('لا توجد سجلات للتصدير', 'warning');
  const headers = ['التاريخ','الوقت','النوع','الرقم المرجعي','التفاصيل','المستخدم','created_at'];
  const csv = '\ufeff' + [headers.map(csvEscape).join(','), ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))].join('\n');
  downloadTextFile(`axentro-logs-${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv;charset=utf-8');
}

export function initLogsPage() {
  supabase = window.supabaseClient;
  ['logsFromDate','logsToDate','logsType','logsSearch'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => render(applyFilters(latestRows)));
    document.getElementById(id)?.addEventListener('change', () => render(applyFilters(latestRows)));
  });
}
