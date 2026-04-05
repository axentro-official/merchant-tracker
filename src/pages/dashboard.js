/**
 * Dashboard Page
 * Main dashboard with statistics and quick actions
 */

import { 
    getTransfers, getCollections, getMerchants, getMachines,
    setTransfers, setCollections 
} from '../ui/stateManager.js';
import { formatMoney, formatNumber, formatDate } from '../utils/formatters.js';
import { getCurrentArabicMonth, getTodayDate } from '../utils/helpers.js';

/**
 * Render dashboard statistics
 */
export function renderDashboard() {
    const now = new Date();
    const currentMonth = getCurrentArabicMonth();
    const today = getTodayDate();
    
    const transfers = getTransfers();
    const collections = getCollections();
    const merchants = getMerchants();
    const machines = getMachines();
    
    // Calculate monthly stats
    const monthTransfers = transfers.filter(t => t['الشهر'] === currentMonth);
    const totalTransfersVal = monthTransfers.reduce(
        (sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 
        0
    );
    
    const totalCollectionsVal = collections
        .filter(c => c['شهر'] === currentMonth)
        .reduce((sum, c) => sum + (Number(c['قيمة التحصيل']) || 0), 0);
    
    const todayTransfers = transfers
        .filter(t => t['التاريخ'] === today)
        .reduce((sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 0);

    // Stats configuration
    const stats = [
        { 
            label: 'عدد التجار', 
            value: merchants.length, 
            icon: 'fa-users', 
            type: '',
            isMoney: false
        },
        { 
            label: 'عدد المكن', 
            value: machines.length, 
            icon: 'fa-cash-register', 
            type: 'purple',
            isMoney: false
        },
        { 
            label: 'تحويلات الشهر', 
            value: totalTransfersVal, 
            icon: 'fa-exchange-alt', 
            type: 'danger',
            isMoney: true
        },
        { 
            label: 'تحصيلات الشهر', 
            value: totalCollectionsVal, 
            icon: 'fa-hand-holding-usd', 
            type: 'success',
            isMoney: true
        },
        { 
            label: 'صافي الشهر', 
            value: totalTransfersVal - totalCollectionsVal, 
            icon: 'fa-balance-scale', 
            type: 'warning',
            isMoney: true
        },
        { 
            label: 'تحويلات اليوم', 
            value: todayTransfers, 
            icon: 'fa-calendar-day', 
            type: '',
            isMoney: true
        }
    ];

    // Render stats cards
    const container = document.getElementById('dashboardStats');
    container.innerHTML = stats.map(stat => `
        <div class="stat-card ${stat.type}">
            <div class="stat-card-header">
                <span class="stat-card-title">${stat.label}</span>
                <div class="stat-card-icon">
                    <i class="fas ${stat.icon}"></i>
                </div>
            </div>
            <div class="stat-card-value">
                ${stat.isMoney ? formatMoney(stat.value) : formatNumber(stat.value)}
            </div>
        </div>
    `).join('');

    // Render top machines table
    renderTopMachines();
}

/**
 * Render top performing machines table
 */
function renderTopMachines() {
    const tbody = document.getElementById('topMachinesTable');
    const currentMonth = getCurrentArabicMonth();
    
    const transfers = getTransfers();
    const machines = getMachines();
    const merchants = getMerchants();
    
    const monthTransfers = transfers.filter(t => t['الشهر'] === currentMonth);

    // Calculate machine performance
    const machinePerformance = machines
        .filter(m => Number(m['التارجت الشهري']) > 0)
        .map(m => {
            const achieved = monthTransfers
                .filter(t => String(t['رقم المكنة']).trim() === String(m['رقم المكنة']).trim())
                .reduce((sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 0);
            
            const merchant = merchants.find(
                mer => mer['رقم التاجر'] == m['رقم التاجر']
            );
            
            return {
                ...m,
                achieved,
                merchantName: merchant?.['اسم التاجر'] || '-',
                activity: merchant?.['اسم النشاط'] || '-',
                percentage: Math.min(
                    Math.floor((achieved / Number(m['التارجت الشهري'])) * 100),
                    100
                )
            };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

    // Empty state
    if (!machinePerformance.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد بيانات</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = machinePerformance.map((machine, index) => {
        const pctClass = machine.percentage >= 80 
            ? 'success' 
            : machine.percentage >= 50 
                ? 'warning' 
                : 'danger';
                
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${machine['رقم المكنة']}</strong></td>
                <td>${machine.merchantName}</td>
                <td>${machine.activity}</td>
                <td>${formatMoney(machine['التارجت الشهري'])}</td>
                <td>${formatMoney(machine.achieved)}</td>
                <td>
                    <span class="badge badge-${pctClass}">${machine.percentage}%</span>
                    <div class="progress-bar">
                        <div class="fill ${pctClass}" style="width:${machine.percentage}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
