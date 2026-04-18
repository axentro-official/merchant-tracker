/**
 * Formatting Utilities
 * Number, date, and text formatting functions
 */

export function formatDate(dateStr) {
    if (!dateStr) return '-';

    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateStr;
    }
}

export function formatTime(timeStr) {
    if (!timeStr) return '-';

    try {
        const plainTime = formatTimeText(timeStr);
        return `<span class="time-badge">${plainTime}</span>`;
    } catch (error) {
        return `<span class="time-badge">${escapeHtml(String(timeStr))}</span>`;
    }
}

export function formatTimeText(timeStr) {
    if (!timeStr) return '-';

    if (typeof timeStr === 'string' && /(AM|PM)$/i.test(timeStr.trim())) {
        return timeStr.trim();
    }

    if (typeof timeStr === 'string' && timeStr.includes(':')) {
        const parts = timeStr.split(':');
        let hours = parseInt(parts[0], 10) || 0;
        const minutes = String(parts[1] || '00').padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    return String(timeStr);
}

export function formatTimeForDB(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

export function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '0';

    const n = typeof num === 'string'
        ? parseFloat(num.replace(/[^\d.-]/g, '')) || 0
        : Number(num);

    if (isNaN(n)) return '0';

    return n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
}

function parseMoneyValue(num) {
    if (num === null || num === undefined || num === '') return 0;

    const n = typeof num === 'string'
        ? parseFloat(num.replace(/[^\d.-]/g, '')) || 0
        : Number(num);

    return Number.isFinite(n) ? n : 0;
}

export function formatMoneyText(num) {
    const n = parseMoneyValue(num);
    return `${Math.abs(n).toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} جنيه`;
}

export function formatMoney(num) {
    const text = formatMoneyText(num).replace(' جنيه', '');
    return `${text} <span class="currency">جنيه</span>`;
}

export function normalizeText(str) {
    return (str || '').toString()
        .trim()
        .replace(/[إأآا]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[يى]/g, 'ي')
        .replace(/[ؐ-ًؚ-ٰٟ]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
