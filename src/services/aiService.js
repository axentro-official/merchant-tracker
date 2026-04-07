/**
 * AI Service - Hybrid Rules Engine & AI Integration
 * Provides intelligent responses using either:
 * 1. AI Endpoint (OpenAI / Ollama / Custom)
 * 2. Smart Rules Engine (fallback)
 * 
 * @version 1.0.0
 */

import { CONFIG } from '../config/supabase.js';
import { getMerchants, getMachines, getTransfers, getCollections } from '../ui/stateManager.js';
import { formatMoney, formatNumber } from '../utils/formatters.js';

// ============================================================
// RULES ENGINE DEFINITIONS
// ============================================================

/**
 * Rules patterns and their handlers
 * Each rule has: pattern (regex), handler (function), description
 */
const RULES = [
    {
        patterns: ['أعلى تاجر', 'أفضل تاجر', 'top merchant', 'best merchant'],
        description: 'إيجاد أعلى تاجر',
        handler: handleTopMerchant
    },
    {
        patterns: ['إجمالي التحصيلات', 'مجموع التحصيلات', 'total collections', 'total collection'],
        description: 'حساب إجمالي التحصيلات',
        handler: handleTotalCollections
    },
    {
        patterns: ['عدد التجار', 'كم تاجر', 'how many merchants', 'merchant count'],
        description: 'عدد التجار',
        handler: handleMerchantCount
    },
    {
        patterns: ['عدد المكن', 'كم مكنة', 'how many machines', 'machine count'],
        description: 'عدد المكن',
        handler: handleMachineCount
    },
    {
        patterns: ['إجمالي التحويلات', 'مجموع التحويلات', 'total transfers', 'total transfer'],
        description: 'إجمالي التحويلات',
        handler: handleTotalTransfers
    },
    {
        patterns: ['تحليل', 'analysis', 'report', 'تقرير', 'ملخص', 'summary'],
        description: 'تحليل بسيط للبيانات',
        handler: handleAnalysis
    },
    {
        patterns: ['مرحبا', 'hello', 'hi', 'اهلا', 'سلام', 'help', 'مساعدة'],
        description: 'رسالة ترحيب',
        handler: handleGreeting
    },
    {
        patterns: ['شكرا', 'thank', 'thanks', 'ok', 'تمام'],
        description: 'رد الشكر',
        handler: handleThanks
    }
];

// ============================================================
// RULE HANDLERS
// ============================================================

/**
 * Handle "Top Merchant" query
 * @returns {string} Response
 */
function handleTopMerchant() {
    const merchants = getMerchants();
    const transfers = getTransfers();
    
    if (!merchants.length) {
        return '📊 لا يوجد تجار في النظام حالياً.';
    }
    
    // Calculate total transfers per merchant
    const merchantTotals = {};
    transfers.forEach(t => {
        const merchantId = t['رقم التاجر'];
        const amount = Number(t['قيمة التحويل']) || 0;
        merchantTotals[merchantId] = (merchantTotals[merchantId] || 0) + amount;
    });
    
    // Find merchant with highest transfers
    let topMerchant = null;
    let maxAmount = 0;
    
    merchants.forEach(m => {
        const total = merchantTotals[m['رقم التاجر']] || 0;
        if (total > maxAmount) {
            maxAmount = total;
            topMerchant = m;
        }
    });
    
    if (topMerchant && maxAmount > 0) {
        return `🏆 **أعلى تاجر:**\n\n` +
               `• **الاسم:** ${topMerchant['اسم التاجر']}\n` +
               `• **رقم التاجر:** ${topMerchant['رقم التاجر']}\n` +
               `• **النشاط:** ${topMerchant['اسم النشاط'] || '-'}\n` +
               `• **إجمالي التحويلات:** ${formatMoney(maxAmount)}\n` +
               `• **الحالة:** ${topMerchant['الحالة'] || '-'}`;
    }
    
    // If no transfers, return merchant with most machines
    const machineCounts = {};
    getMachines().forEach(m => {
        const mid = m['رقم التاجر'];
        machineCounts[mid] = (machineCounts[mid] || 0) + 1;
    });
    
    let topByMachines = null;
    let maxMachines = 0;
    
    merchants.forEach(m => {
        const count = machineCounts[m['رقم التاجر']] || 0;
        if (count > maxMachines) {
            maxMachines = count;
            topByMachines = m;
        }
    });
    
    if (topByMachines) {
        return `🏆 **أعلى تاجر (بعدد المكن):**\n\n` +
               `• **الاسم:** ${topByMachines['اسم التاجر']}\n` +
               `• **عدد المكن:** ${maxMachines}\n` +
               `• **الحالة:** ${topByMachines['الحالة'] || '-'}`;
    }
    
    return `📊 **أول تاجر في القائمة:** ${merchants[0]['اسم التاجر']} (${merchants[0]['رقم التاجر']})`;
}

/**
 * Handle "Total Collections" query
 * @returns {string} Response
 */
function handleTotalCollections() {
    const collections = getCollections();
    
    if (!collections.length) {
        return '📊 لا توجد تحصيلات مسجلة.';
    }
    
    const total = collections.reduce((sum, c) => sum + (Number(c['قيمة التحصيل']) || 0), 0);
    const count = collections.length;
    
    return `💰 **إجمالي التحصيلات:**\n\n` +
           `• **المبلغ الإجمالي:** ${formatMoney(total)}\n` +
           `• **عدد عمليات التحصيل:** ${count}\n` +
           `• **متوسط قيمة التحصيل:** ${formatMoney(total / count)}`;
}

/**
 * Handle "Merchant Count" query
 * @returns {string} Response
 */
function handleMerchantCount() {
    const merchants = getMerchants();
    const active = merchants.filter(m => m['الحالة'] === 'نشط' || m['الحالة'] === 'نشطة').length;
    const inactive = merchants.length - active;
    
    return `👥 **عدد التجار:**\n\n` +
           `• **الإجمالي:** ${merchants.length} تاجر\n` +
           `• **نشطين:** ${active}\n` +
           `• **غير نشطين:** ${inactive}`;
}

/**
 * Handle "Machine Count" query
 * @returns {string} Response
 */
function handleMachineCount() {
    const machines = getMachines();
    const active = machines.filter(m => m['الحالة'] === 'نشطة' || m['الحالة'] === 'نشط').length;
    const inactive = machines.length - active;
    
    return `🖥️ **عدد المكن:**\n\n` +
           `• **الإجمالي:** ${machines.length} مكنة\n` +
           `• **نشطة:** ${active}\n` +
           `• **متوقفة:** ${inactive}`;
}

/**
 * Handle "Total Transfers" query
 * @returns {string} Response
 */
function handleTotalTransfers() {
    const transfers = getTransfers();
    
    if (!transfers.length) {
        return '📊 لا توجد تحويلات مسجلة.';
    }
    
    const total = transfers.reduce((sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 0);
    const count = transfers.length;
    
    return `💸 **إجمالي التحويلات:**\n\n` +
           `• **المبلغ الإجمالي:** ${formatMoney(total)}\n` +
           `• **عدد العمليات:** ${count}\n` +
           `• **متوسط قيمة التحويل:** ${formatMoney(total / count)}`;
}

/**
 * Handle "Analysis" query
 * @returns {string} Response
 */
function handleAnalysis() {
    const merchants = getMerchants();
    const machines = getMachines();
    const transfers = getTransfers();
    const collections = getCollections();
    
    const totalTransfers = transfers.reduce((sum, t) => sum + (Number(t['قيمة التحويل']) || 0), 0);
    const totalCollections = collections.reduce((sum, c) => sum + (Number(c['قيمة التحصيل']) || 0), 0);
    const balance = totalTransfers - totalCollections;
    
    let analysis = `📊 **تحليل البيانات:**\n\n`;
    analysis += `--- **ملخص عام** ---\n`;
    analysis += `• التجار: ${merchants.length}\n`;
    analysis += `• المكن: ${machines.length}\n`;
    analysis += `• التحويلات: ${transfers.length} (إجمالي: ${formatMoney(totalTransfers)})\n`;
    analysis += `• التحصيلات: ${collections.length} (إجمالي: ${formatMoney(totalCollections)})\n\n`;
    
    analysis += `--- **المركز المالي** ---\n`;
    analysis += `• **صافي الرصيد:** ${formatMoney(balance)}\n`;
    
    if (balance > 0) {
        analysis += `• **الحالة:** ⚠️ هناك مستحقات (${formatMoney(balance)})\n`;
    } else if (balance < 0) {
        analysis += `• **الحالة:** ✅ فائض في التحصيل\n`;
    } else {
        analysis += `• **الحالة:** ⚖️ متوازن\n`;
    }
    
    // Top 3 merchants by transfers
    const merchantTransfers = {};
    transfers.forEach(t => {
        const mid = t['رقم التاجر'];
        merchantTransfers[mid] = (merchantTransfers[mid] || 0) + (Number(t['قيمة التحويل']) || 0);
    });
    
    const sortedMerchants = Object.entries(merchantTransfers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (sortedMerchants.length > 0) {
        analysis += `\n--- **أعلى 3 تجار (تحويلات)** ---\n`;
        sortedMerchants.forEach(([id, amount], index) => {
            const merchant = merchants.find(m => m['رقم التاجر'] == id);
            const name = merchant ? merchant['اسم التاجر'] : `تاجر #${id}`;
            analysis += `${index + 1}. ${name}: ${formatMoney(amount)}\n`;
        });
    }
    
    return analysis;
}

/**
 * Handle greeting messages
 * @returns {string} Response
 */
function handleGreeting() {
    return `👋 **مرحباً!**\n\n` +
           `أنا مساعدك الذكي في نظام Axentro.\n\n` +
           `**يمكنني مساعدتك في:**\n` +
           `• 📊 معرفة الإحصائيات والتقارير\n` +
           `• 👥 بيانات التجار والمكن\n` +
           `• 💰 حسابات التحويلات والتحصيلات\n` +
           `• 📈 تحليل البيانات\n\n` +
           `**ماذا تريد أن تعرف؟**`;
}

/**
 * Handle thanks messages
 * @returns {string} Response
 */
function handleThanks() {
    const responses = [
        '😊 العفو! دائماً في خدمتك.',
        '👍 على الرحب والسعة!',
        '✨ سعيد بمساعدتك!',
        '💫 هل هناك شيء آخر يمكنني مساعدتك فيه؟'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// ============================================================
// AI ENDPOINT INTEGRATION (PREPARED)
// ============================================================

/**
 * Call AI endpoint if configured
 * @param {string} message - User's message
 * @returns {Promise<string|null>} AI response or null if unavailable
 */
async function callAiEndpoint(message) {
    const { ENDPOINT_URL, API_KEY, MODEL, MAX_TOKENS } = CONFIG.AI_CONFIG;
    
    // Check if AI is configured
    if (!ENDPOINT_URL || !API_KEY) {
        return null;
    }
    
    try {
        // Prepare context with current data summary
        const context = buildDataContext();
        
        // Make API call (supports OpenAI-compatible APIs)
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `أنت مساعد ذكي لنظام إدارة التجار (Axentro). أجب باللغة العربية. سياق البيانات الحالية:\n\n${context}`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: MAX_TOKENS || 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
        
    } catch (error) {
        console.warn('⚠️ AI endpoint error:', error.message);
        return null;
    }
}

/**
 * Build current data context for AI
 * @returns {string} Context string
 */
function buildDataContext() {
    const merchants = getMerchants();
    const machines = getMachines();
    const transfers = getTransfers();
    const collections = getCollections();
    
    return `
التجار: ${merchants.length}
المكن: ${machines.length}
التحويلات: ${transfers.length} (إجمالي: ${transfers.reduce((s,t) => s + (Number(t['قيمة التحويل'])||0), 0)})
التحصيلات: ${collections.length} (إجمالي: ${collections.reduce((s,c) => s + (Number(c['قيمة التحصيل'])||0), 0)})
    `.trim();
}

// ============================================================
// MAIN PROCESSING FUNCTION
// ============================================================

/**
 * Process user query and return intelligent response
 * Uses AI endpoint if available, otherwise falls back to rules engine
 * 
 * @param {string} message - User's query
 * @returns {Promise<string>} Response message
 */
export async function processQuery(message) {
    if (!message || !message.trim()) {
        return '❓ لم أفهم سؤالك. Could you please rephrase?';
    }
    
    const normalizedMessage = message.trim().toLowerCase();
    
    console.log(`🤖 Processing query: "${message}"`);
    
    // Try AI endpoint first (if configured)
    if (CONFIG.AI_CONFIG.ENDPOINT_URL && CONFIG.AI_CONFIG.API_KEY) {
        console.log('🔄 Trying AI endpoint...');
        const aiResponse = await callAiEndpoint(message);
        if (aiResponse) {
            console.log('✅ AI responded');
            return aiResponse;
        }
        console.log('⚠️ AI endpoint failed, falling back to rules engine');
    }
    
    // Fall back to rules engine
    console.log('📋 Using rules engine...');
    
    // Find matching rule
    for (const rule of RULES) {
        for (const pattern of rule.patterns) {
            if (normalizedMessage.includes(pattern.toLowerCase())) {
                console.log(`✅ Matched rule: ${rule.description}`);
                return rule.handler();
            }
        }
    }
    
    // No matching rule found
    return `❓ لم أفهم سؤالك تماماً.\n\n` +
           `**يمكنني مساعدتك في:**\n` +
           `• "أعلى تاجر"\n` +
           `• "إجمالي التحصيلات"\n` +
           `• "عدد التجار" أو "عدد المكن"\n` +
           `• "إجمالي التحويلات"\n` +
           `• "تحليل" للملخص العام\n\n` +
           `حاول صياغة سؤالك بطريقة أخرى! 🤖`;
}

/**
 * Get available commands list
 * @returns {Array} List of available commands
 */
export function getAvailableCommands() {
    return RULES.map(rule => ({
        command: rule.patterns[0],
        description: rule.description,
        examples: rule.patterns.slice(0, 2)
    }));
}
