/**
 * AI Service - Hybrid System (Rules Engine + AI Endpoint)
 * Supports:
 * - Largest merchant queries
 * - Target analysis
 * - Goal tracking
 * - Smart Q&A
 * @version 5.0.0
 */

import { CONFIG } from '../config/supabase.js';

// ============================================================
// RULES ENGINE (Fallback when AI unavailable)
// ============================================================

const RulesEngine = {
    /**
     * Process query using rules engine
     * @param {string} query - User query
     * @param {Object} context - Application context (state data)
     * @returns {Promise<string>} Response
     */
    async process(query, context = {}) {
        const normalizedQuery = query.toLowerCase().trim();
        
        // Rule 1: Who is the largest/highest/best merchant?
        if (this.matchesPattern(normalizedQuery, ['أكبر تاجر', 'أعلى تاجر', 'أفضل تاجر', 'largest merchant', 'top merchant'])) {
            return this.getLargestMerchant(context);
        }
        
        // Rule 2: How many merchants?
        if (this.matchesPattern(normalizedQuery, ['عدد التجار', 'كم تاجر', 'how many merchants'])) {
            return this.getMerchantCount(context);
        }
        
        // Rule 3: Target analysis
        if (this.matchesPattern(normalizedQuery, ['الأهداف', 'التارجت', 'targets', 'goals'])) {
            return this.getTargetAnalysis(context);
        }
        
        // Rule 4: Today's statistics
        if (this.matchesPattern(normalizedQuery, ['إحصائيات اليوم', 'today stats', 'اليوم'])) {
            return this.getTodayStats(context);
        }
        
        // Rule 5: Monthly summary
        if (this.matchesPattern(normalizedQuery, ['ملخص الشهر', 'monthly summary', 'شهري'])) {
            return this.getMonthlySummary(context);
        }
        
        // Rule 6: Machine performance
        if (this.matchesPattern(normalizedQuery, ['أداء المكن', 'machine performance', 'المكن'])) {
            return this.getMachinePerformance(context);
        }
        
        // Rule 7: Pending requests
        if (this.matchesPattern(normalizedQuery, ['طلبات معلقة', 'pending requests', 'الطلبات'])) {
            return this.getPendingRequestsInfo(context);
        }
        
        // Rule 8: Help/Guide
        if (this.matchesPattern(normalizedQuery, ['مساعدة', 'help', 'مساعد', 'كيف'])) {
            return this.getHelpMessage();
        }
        
        // Default: Unknown query response
        return this.getDefaultResponse(query);
    },
    
    /**
     * Check if query matches any pattern
     * @param {string} query - Normalized query
     * @param {Array<string>} patterns - Patterns to match
     * @returns {boolean} Match result
     */
    matchesPattern(query, patterns) {
        return patterns.some(pattern => query.includes(pattern.toLowerCase()));
    },
    
    /**
     * Get largest merchant by transfer volume
     */
    getLargestMerchant(context) {
        const { merchants = [], transfers = [] } = context;
        
        if (merchants.length === 0) {
            return '📊 لا يوجد تجار مسجلين في النظام حالياً.';
        }
        
        // Calculate totals per merchant
        const merchantTotals = {};
        transfers.forEach(t => {
            const merchantNum = t['رقم التاجر'];
            const amount = parseFloat(t['قيمة التحويل']) || 0;
            merchantTotals[merchantNum] = (merchantTotals[merchantNum] || 0) + amount;
        });
        
        // Find highest
        let maxMerchant = null;
        let maxTotal = 0;
        
        Object.entries(merchantTotals).forEach(([num, total]) => {
            if (total > maxTotal) {
                maxTotal = total;
                maxMerchant = merchants.find(m => m['رقم التاجر'] === num);
            }
        });
        
        if (!maxMerchant) {
            maxMerchant = merchants[0]; // Fallback to first merchant
            maxTotal = 0;
        }
        
        return `🏆 **أكبر تاجر:**\n\n` +
               `- **الاسم:** ${maxMerchant['اسم التاجر']}\n` +
               `- **رقم التاجر:** ${maxMerchant['رقم التاجر']}\n` +
               `- **النشاط:** ${maxMerchant['اسم النشاط'] || 'غير محدد'}\n` +
               `- **إجمالي التحويلات:** ${maxTotal.toLocaleString()} ج.م\n` +
               `- **الهاتف:** ${maxMerchant['رقم الهاتف'] || 'غير محدد'}\n` +
               `- **المنطقة:** ${maxMerchant['المنطقة'] || 'غير محدد'}`;
    },
    
    /**
     * Get merchant count
     */
    getMerchantCount(context) {
        const { merchants = [], machines = [] } = context;
        
        return `📈 **إحصائية التجار:**\n\n` +
               `- **إجمالي التجار:** ${merchants.length} تاجر\n` +
               `- **إجمالي المكن:** ${machines.length} مكنة\n` +
               `- **متوسط المكن لكل تاجر:** ${(machines.length / Math.max(merchants.length, 1)).toFixed(1)} مكنة`;
    },
    
    /**
     * Get target analysis
     */
    getTargetAnalysis(context) {
        const { machines = [] } = context;
        
        if (machines.length === 0) {
            return '📊 لا توجد مكن مسجلة لتحليل الأهداف.';
        }
        
        const achieved = machines.filter(m => {
            const target = parseFloat(m['التارجت']) || 0;
            const achieved_val = parseFloat(m['المحقق']) || 0;
            return achieved_val >= target;
        }).length;
        
        const partial = machines.filter(m => {
            const target = parseFloat(m['التارجت']) || 0;
            const achieved_val = parseFloat(m['المحقق']) || 0;
            return achieved_val > 0 && achieved_val < target;
        }).length;
        
        const notStarted = machines.length - achieved - partial;
        
        const overallAchievement = machines.reduce((sum, m) => {
            const target = parseFloat(m['التارجت']) || 0;
            const achieved_val = parseFloat(m['المحقق']) || 0;
            return sum + (target > 0 ? (achieved_val / target) * 100 : 0);
        }, 0) / Math.max(machines.length, 1);
        
        return `🎯 **تحليل الأهداف:**\n\n` +
               `- **إجمالي المكن:** ${machines.length}\n` +
               `- **حققت هدفها:** ✅ ${achieved} (${((achieved/machines.length)*100).toFixed(1)}%)\n` +
               `- **في الطريق:** 🟡 ${partial} (${((partial/machines.length)*100).toFixed(1)}%)\n` +
               `- **لم تبدأ بعد:** 🔴 ${notStarted} (${((notStarted/machines.length)*100).toFixed(1)}%)\n` +
               `- **نسبة الإنجاز العامة:** ${overallAchievement.toFixed(1)}%`;
    },
    
    /**
     * Get today's statistics
     */
    getTodayStats(context) {
        const { transfers = [], collections = [] } = context;
        const today = new Date().toISOString().split('T')[0];
        
        const todayTransfers = transfers.filter(t => t['التاريخ'] === today);
        const todayCollections = collections.filter(c => c['التاريخ'] === today);
        
        const transferTotal = todayTransfers.reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
        const collectionTotal = todayCollections.reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
        
        return `📅 **إحصائيات اليوم (${today}):**\n\n` +
               `- **عدد التحويلات:** ${todayTransfers.length}\n` +
               `- **إجمالي التحويلات:** ${transferTotal.toLocaleString()} ج.م\n` +
               `- **عدد التحصيلات:** ${todayCollections.length}\n` +
               `- **إجمالي التحصيلات:** ${collectionTotal.toLocaleString()} ج.م\n` +
               `- **صافي اليوم:** ${(transferTotal - collectionTotal).toLocaleString()} ج.م`;
    },
    
    /**
     * Get monthly summary
     */
    getMonthlySummary(context) {
        const { transfers = [], collections = [], archives = [] } = context;
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const monthTransfers = transfers.filter(t => {
            const date = new Date(t['التاريخ']);
            return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
        });
        
        const monthCollections = collections.filter(c => {
            const date = new Date(c['التاريخ']);
            return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
        });
        
        const transferTotal = monthTransfers.reduce((sum, t) => sum + (parseFloat(t['قيمة التحويل']) || 0), 0);
        const collectionTotal = monthCollections.reduce((sum, c) => sum + (parseFloat(c['قيمة التحصيل']) || 0), 0);
        
        return `📊 **ملخص الشهر الحالي:**\n\n` +
               `- **عدد التحويلات:** ${monthTransfers.length}\n` +
               `- **إجمالي التحويلات:** ${transferTotal.toLocaleString()} ج.م\n` +
               `- **عدد التحصيلات:** ${monthCollections.length}\n` +
               `- **إجمالي التحصيلات:** ${collectionTotal.toLocaleString()} ج.م\n` +
               `- **المتبقي:** ${(transferTotal - collectionTotal).toLocaleString()} ج.م`;
    },
    
    /**
     * Get machine performance ranking
     */
    getMachinePerformance(context) {
        const { machines = [] } = context;
        
        if (machines.length === 0) {
            return '🖥️ لا توجد مكن مسجلة.';
        }
        
        // Sort by achievement percentage
        const sorted = [...machines].sort((a, b) => {
            const targetA = parseFloat(a['التارجت']) || 0;
            const achievedA = parseFloat(a['المحقق']) || 0;
            const targetB = parseFloat(b['التارجت']) || 0;
            const achievedB = parseFloat(b['المحقق']) || 0;
            
            const pctA = targetA > 0 ? (achievedA / targetA) * 100 : 0;
            const pctB = targetB > 0 ? (achievedB / targetB) * 100 : 0;
            
            return pctB - pctA;
        }).slice(0, 5); // Top 5
        
        let response = `🖥️ **أعلى 5 مكن أداءً:**\n\n`;
        sorted.forEach((m, idx) => {
            const target = parseFloat(m['التارجت']) || 0;
            const achieved = parseFloat(m['المحقق']) || 0;
            const pct = target > 0 ? ((achieved / target) * 100).toFixed(1) : 0;
            const emoji = pct >= 100 ? '🟢' : pct >= 50 ? '🟡' : '🔴';
            
            response += `${idx + 1}. ${emoji} **${m['الرقم التسلسلي'] || m['رقم المكنة']}** - ${pct}%\n`;
        });
        
        return response;
    },
    
    /**
     * Get pending requests info
     */
    getPendingRequestsInfo(context) {
        const { requests = [] } = context;
        const pending = requests.filter(r => r['الحالة'] === 'pending' || r['الحالة'] === 'معلق');
        
        if (pending.length === 0) {
            return '✅ لا توجد طلبات معلقة حالياً.';
        }
        
        let response = `⚠️ **الطلبات المعلقة (${pending.length}):**\n\n`;
        pending.slice(0, 5).forEach((r, idx) => {
            response += `${idx + 1}. **طلب #${r['رقم الطلب']}** - ${r['اسم التاجر']}\n` +
                       `   المبلغ: ${r['المبلغ المطلوب']} | النوع: ${r['نوع الطلب']}\n\n`;
        });
        
        if (pending.length > 5) {
            response += `... و ${pending.length - 5} طلب(ات) أخرى`;
        }
        
        return response;
    },
    
    /**
     * Get help message
     */
    getHelpMessage() {
        return `🤖 **يمكنني مساعدتك في:**\n\n` +
               `• **أكبر تاجر** - معرفة أعلى تاجر من حيث التحويلات\n` +
               `• **عدد التجار** - إحصائيات عن التجار والمكن\n` +
               `• **الأهداف/التارجت** - تحليل أداء المكن والأهداف\n` +
               `• **إحصائيات اليوم** - ملخص عمليات اليوم\n` +
               `• **ملخص الشهر** - إحصائيات شهرية شاملة\n` +
               `• **أداء المكن** - ترتيب المكن حسب الأداء\n` +
               `• **الطلبات** - معرفة الطلبات المعلقة\n\n` +
               `💡 فقط اكتب سؤالك وسأجيب عليه!`;
    },
    
    /**
     * Default response for unknown queries
     */
    getDefaultResponse(query) {
        return `❓ لم أفهم سؤالك: "${query}"\n\n` +
               `💡 **جرب أحد هذه الأسئلة:**\n` +
               `- من هو أكبر تاجر؟\n` +
               `- كم عدد التجار؟\n` +
               `- ما هي إحصائيات اليوم؟\n` +
               `- كيف حالة الأهداف؟\n` +
               `- ما هي الطلبات المعلقة؟\n\n` +
               `أو اكتب "مساعدة" للمزيد من المعلومات.`;
    }
};

// ============================================================
// AI SERVICE (Main Export)
// ============================================================

/**
 * Process AI query using hybrid system
 * Tries AI endpoint first, falls back to rules engine
 * @param {string} query - User query
 * @param {Object} context - Application state context
 * @returns {Promise<string>} AI response
 */
export async function processAiQuery(query, context = {}) {
    const aiConfig = CONFIG.AI_CONFIG;
    
    // If AI is disabled, use rules only
    if (!aiConfig.ENABLED) {
        return RulesEngine.process(query, context);
    }
    
    // If no endpoint configured, use rules only
    if (!aiConfig.ENDPOINT_URL || !aiConfig.API_KEY) {
        console.log('ℹ️ No AI endpoint configured, using rules engine');
        return RulesEngine.process(query, context);
    }
    
    // Try AI endpoint
    try {
        const response = await callAiEndpoint(query, context, aiConfig);
        return response;
    } catch (error) {
        console.warn('⚠️ AI endpoint failed, falling back to rules engine:', error.message);
        return RulesEngine.process(query, context);
    }
}

/**
 * Call external AI endpoint (OpenAI/Ollama compatible)
 * @param {string} query - User query
 * @param {Object} context - Context data
 * @param {Object} config - AI configuration
 * @returns {Promise<string>} AI response
 */
async function callAiEndpoint(query, context, config) {
    const systemPrompt = `أنت مساعد ذكي لنظام إدارة التجار والمكن (Axentro System).
    يجب أن تجيب باللغة العربية دائماً.
    استخدم البيانات التالية للإجابة على الأسئلة:
    - التجار: ${JSON.stringify(context.merchants || []).slice(0, 500)}
    - المكن: ${JSON.stringify(context.machines || []).slice(0, 500)}
    - التحويلات: ${JSON.stringify(context.transfers || []).slice(0, 500)}
    - التحصيلات: ${JSON.stringify(context.collections || []).slice(0, 500)}
    - الطلبات: ${JSON.stringify(context.requests || []).slice(0, 500)}
    
    كن محدداً في إجاباتك واستخدم الأرقام عند توفرها.`;
    
    const response = await fetch(config.ENDPOINT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.API_KEY}`
        },
        body: JSON.stringify({
            model: config.MODEL || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            max_tokens: config.MAX_TOKENS || 500,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || RulesEngine.getDefaultResponse(query);
}

// Export rules engine for direct access if needed
export { RulesEngine };
