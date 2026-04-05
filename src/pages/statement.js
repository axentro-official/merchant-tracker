/**
 * Statement Page
 * Account statement for individual merchants
 */

import { getMerchants, getTransfers, getCollections } from '../ui/stateManager.js';
import { showToast } from '../ui/toast.js';
import { formatDate, formatTime, formatMoney } from '../utils/formatters.js';
import { findMerchantById } from '../services/merchantService.js';
import { getMerchantTransfers, calculateTotalTransfers } from '../services/transactionService.js';
import { getMerchantCollections, calculateTotalCollections } from '../services/collectionService.js';

/**
 * Load and display merchant statement
 */
export function loadStatement() {
    const merchantId = document.getElementById('stmtMerchantId')?.value;
    
    if (!merchantId) {
        showToast('⚠️ اختر تاجراً أولاً', 'warning');
        return;
    }

    const merchant = findMerchantById(merchantId, getMerchants());
    
    if (!merchant) {
        showToast('❌ لم يتم العثور على التاجر', 'error');
        return;
    }

    // Get merchant's transactions
    const transfers = getMerchantTransfers(merchantId, getTransfers())
        .sort((a, b) => {
            const dateA = new Date(a['التاريخ'] + ' ' + (a['وقت'] || ''));
            const dateB = new Date(b['التاريخ'] + ' ' + (b['وقت'] || ''));
            return dateB - dateA;
        });
    
    const collections = getMerchantCollections(merchantId, getCollections())
        .sort((a, b) => {
            const dateA = new Date(a['التاريخ'] + ' ' + (a['وقت'] || ''));
            const dateB = new Date(b['التاريخ'] + ' ' + (b['وقت'] || ''));
            return dateB - dateA;
        });

    // Calculate totals
    const totalTransfers = calculateTotalTransfers(transfers);
    const totalCollections = calculateTotalCollections(collections);
    const remaining = totalTransfers - totalCollections;

    // Update stats display
    document.getElementById('stmtTotalTransfers').innerHTML = formatMoney(totalTransfers);
    document.getElementById('stmtTotalCollections').innerHTML = formatMoney(totalCollections);
    document.getElementById('stmtRemaining').innerHTML = formatMoney(remaining);

    // Merge and sort movements
    const movements = [
        ...transfers.map(t => ({
            ...t,
            _type: 'transfer',
            _sort: `${t['التاريخ']} ${t['وقت']}`,
            _amount: Number(t['قيمة التحويل']) || 0
        })),
        ...collections.map(c => ({
            ...c,
            _type: 'collection',
            _sort: `${c['التاريخ']} ${c['وقت']}`,
            _amount: -(Number(c['قيمة التحصيل']) || 0)
        }))
    ].sort((a, b) => b._sort.localeCompare(a._sort));

    // Render movements table
    const tbody = document.getElementById('statementTable');
    
    if (!movements.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>لا توجد حركات</p>
                </td>
            </tr>
        `;
        return;
    }

    // Build table rows with running balance
    let runningBalance = 0;
    
    tbody.innerHTML = movements.map((movement, index) => {
        const isTransfer = movement._type === 'transfer';
        runningBalance += movement._amount;

        return `
            <tr>
                <td>${movements.length - index}</td>
                <td>${formatDate(movement['التاريخ'])}</td>
                <td>${formatTime(movement['وقت'])}</td>
                <td>
                    <span class="badge ${isTransfer ? 'badge-danger' : 'badge-success'}">
                        ${isTransfer ? '📤 تحويل' : '📥 تحصيل'}
                    </span>
                </td>
                <td style="color:${isTransfer ? 'var(--danger)' : 'var(--success)'};font-weight:700;">
                    ${isTransfer ? '+' : '-'}${formatMoney(Math.abs(movement._amount))}
                </td>
                <td>
                    <strong style="color:${runningBalance >= 0 ? 'var(--text)' : 'var(--danger)'};">
                        ${formatMoney(runningBalance)}
                    </strong>
                </td>
                <td>${movement['ملاحظات'] || '-'}</td>
            </tr>
        `;
    }).join('');
}
