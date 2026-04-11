// src/services/aiService.js
// نسخة محسنة وموسعة مع دعم أسئلة أكثر واحترافية

let supabase = null;

export function initAIService() {
    supabase = window.supabaseClient;
}

// الدالة الرئيسية لمعالجة أي سؤال
export async function processQuery(question, context = {}) {
    // تهيئة Supabase إذا لم تكن جاهزة
    if (!supabase) {
        initAIService();
    }
    const q = question.toLowerCase().trim();
    
    // 1. أسئلة الترحيب والتعريف
    if (q.includes('مرحبا') || q.includes('السلام') || q.includes('hi') || q.includes('hello')) {
        return "مرحباً بك في المساعد الذكي لنظام Axentro! 🎯\nأنا هنا لمساعدتك في:\n• عرض الإحصائيات (عدد التجار، المكن، التحويلات، التحصيلات)\n• تحليل أداء المكن والأهداف\n• معرفة أعلى التاجر تحقيقاً\n• تتبع الطلبات المعلقة\n• تقديم نصائح وتوصيات\n• الإجابة عن أي استفسار حول النظام.\nكيف يمكنني مساعدتك اليوم؟";
    }
    
    if (q.includes('شكرا') || q.includes('thank')) {
        return "عفواً، أنا في خدمتك دائماً. 😊 هل تحتاج مساعدة أخرى؟";
    }
    
    if (q.includes('قدراتك') || q.includes('ماذا يمكنك') || q.includes('help') || q.includes('مساعدة')) {
        return getHelpMessage();
    }
    
    // 2. إحصائيات عامة (عدد التجار، المكن، التحويلات، التحصيلات)
    if (q.includes('عدد التجار') || q.includes('كم تاجر')) {
        const count = await getCount('merchants');
        return `📊 عدد التجار المسجلين حالياً: **${count}** تاجر.`;
    }
    if (q.includes('عدد المكن') || q.includes('كم مكنة')) {
        const count = await getCount('machines');
        return `🖥️ عدد المكن المسجلة حالياً: **${count}** مكنة.`;
    }
    if (q.includes('عدد التحويلات') || q.includes('كم تحويل')) {
        const count = await getCount('transfers');
        const total = await getSum('transfers', 'قيمة التحويل');
        return `💰 إجمالي التحويلات: **${count}** عملية بقيمة **${total.toLocaleString()}** ج.م.`;
    }
    if (q.includes('عدد التحصيلات') || q.includes('كم تحصيل')) {
        const count = await getCount('collections');
        const total = await getSum('collections', 'قيمة التحصيل');
        return `💵 إجمالي التحصيلات: **${count}** عملية بقيمة **${total.toLocaleString()}** ج.م.`;
    }
    
    // 3. إحصائيات اليوم والشهر
    if (q.includes('تحويلات اليوم') || q.includes('تحصيلات اليوم')) {
        const today = new Date().toISOString().split('T')[0];
        const transfers = await getSumByDate('transfers', 'قيمة التحويل', today);
        const collections = await getSumByDate('collections', 'قيمة التحصيل', today);
        return `📅 إحصائيات اليوم (${today}):\n• تحويلات: ${transfers.toLocaleString()} ج.م\n• تحصيلات: ${collections.toLocaleString()} ج.م\n• صافي اليوم: ${(transfers - collections).toLocaleString()} ج.م`;
    }
    
    if (q.includes('هذا الشهر') || (q.includes('شهر') && (q.includes('إحصائيات') || q.includes('ملخص')))) {
        const now = new Date();
        const month = now.toLocaleString('ar-EG', { month: 'long' });
        const year = now.getFullYear();
        const transfers = await getSum('transfers', 'قيمة التحويل');
        const collections = await getSum('collections', 'قيمة التحصيل');
        return `📆 ملخص حتى الآن في شهر ${month} ${year}:\n• إجمالي التحويلات: ${transfers.toLocaleString()} ج.م\n• إجمالي التحصيلات: ${collections.toLocaleString()} ج.م\n• المتبقي: ${(transfers - collections).toLocaleString()} ج.م`;
    }
    
    // 4. المتبقي (إجمالي التحويلات - إجمالي التحصيلات)
    if (q.includes('المتبقي') || q.includes('إجمالي المتبقي') || q.includes('الرصيد الكلي')) {
        const totalT = await getSum('transfers', 'قيمة التحويل');
        const totalC = await getSum('collections', 'قيمة التحصيل');
        const remaining = totalT - totalC;
        return `💰 إجمالي المتبقي على التجار: **${remaining.toLocaleString()}** ج.م.`;
    }
    
    // 5. أعلى تاجر (من حيث قيمة التحويلات)
    if (q.includes('أعلى تاجر') || q.includes('أكبر تاجر') || q.includes('أفضل تاجر')) {
        const top = await getTopMerchantByTransfers();
        if (top) {
            return `🏆 أعلى تاجر من حيث قيمة التحويلات:\n• الاسم: ${top.name}\n• رقم التاجر: ${top.number}\n• النشاط: ${top.activity}\n• إجمالي التحويلات: ${top.total.toLocaleString()} ج.م`;
        } else {
            return "لا توجد بيانات كافية لتحديد أعلى تاجر حالياً.";
        }
    }
    
    // 6. أداء المكن (أعلى مكنة تحقيقاً للتارجت)
    if (q.includes('أداء المكن') || q.includes('أعلى مكنة') || q.includes('أفضل مكنة')) {
        const topMachines = await getTopMachinesByAchievement(5);
        if (topMachines.length === 0) return "لا توجد مكن مسجلة أو لا توجد بيانات أداء.";
        let response = "🏆 **أفضل المكن تحقيقاً للتارجت:**\n\n";
        topMachines.forEach((m, i) => {
            response += `${i+1}. ${m.machineNumber} - ${m.merchantName} (${m.percentage}%)\n   المحقق: ${m.achieved.toLocaleString()} ج.م من ${m.target.toLocaleString()} ج.م\n\n`;
        });
        return response;
    }
    
    // 7. المكن التي لم تحقق التارجت بعد
    if (q.includes('لم تحقق الهدف') || q.includes('تحت التارجت') || q.includes('أقل من الهدف')) {
        const low = await getLowPerformingMachines();
        if (low.length === 0) return "🎉 جميع المكن حققت أهدافها أو لا توجد بيانات!";
        let response = "⚠️ **المكن التي لم تحقق الهدف بعد:**\n\n";
        low.forEach(m => {
            response += `• ${m.machineNumber} - ${m.merchantName} (حقق ${m.percentage}% من الهدف)\n`;
        });
        return response;
    }
    
    // 8. الطلبات المعلقة
    if (q.includes('طلبات معلقة') || q.includes('الطلبات الجديدة') || q.includes('pending requests')) {
        const pending = await getPendingRequests();
        if (pending === 0) return "✅ لا توجد طلبات معلقة حالياً.";
        return `📋 يوجد **${pending}** طلب(ات) معلقة بانتظار المعالجة. يمكنك مراجعتها من صفحة "الطلبات".`;
    }
    
    // 9. نصائح وتحسينات
    if (q.includes('نصيحة') || q.includes('اقتراح') || q.includes('تحسين')) {
        return getTip();
    }
    
    // 10. أسئلة عامة عن النظام
    if (q.includes('ما هو النظام') || q.includes('عن Axentro')) {
        return "Axentro هو نظام متكامل لإدارة التجار والمكن والعمليات المالية (تحويلات، تحصيلات، طلبات، أرشيف). يساعدك على تتبع الأداء وتحليل البيانات وإدارة الطلبات بكفاءة.";
    }
    
    // إذا لم يتعرف على السؤال
    return `❓ لم أفهم سؤالك تماماً. يمكنك أن تسألني عن:\n• إحصائيات عامة (عدد التجار، المكن، التحويلات، التحصيلات)\n• المتبقي الكلي\n• أعلى تاجر أو أفضل مكنة\n• الطلبات المعلقة\n• نصائح لتحسين الأداء\n• أو اكتب "مساعدة" لعرض جميع الإمكانيات.`;
}

// دوال مساعدة لجلب البيانات من Supabase
async function getCount(table) {
    if (!supabase) return 0;
    try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) return 0;
        return count;
    } catch(e) { return 0; }
}

async function getSum(table, column) {
    if (!supabase) return 0;
    try {
        const { data, error } = await supabase.from(table).select(column);
        if (error || !data) return 0;
        return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
    } catch(e) { return 0; }
}

async function getSumByDate(table, column, date) {
    if (!supabase) return 0;
    try {
        const { data, error } = await supabase.from(table).select(column).eq('التاريخ', date);
        if (error || !data) return 0;
        return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
    } catch(e) { return 0; }
}

async function getTopMerchantByTransfers() {
    if (!supabase) return null;
    try {
        const { data: transfers, error } = await supabase.from('transfers').select('رقم التاجر, قيمة التحويل');
        if (error || !transfers) return null;
        const merchantMap = new Map();
        transfers.forEach(t => {
            const id = t['رقم التاجر'];
            const amount = parseFloat(t['قيمة التحويل']) || 0;
            merchantMap.set(id, (merchantMap.get(id) || 0) + amount);
        });
        if (merchantMap.size === 0) return null;
        let topId = null, topAmount = 0;
        for (let [id, total] of merchantMap.entries()) {
            if (total > topAmount) {
                topAmount = total;
                topId = id;
            }
        }
        if (!topId) return null;
        const { data: merchant } = await supabase.from('merchants').select('*').eq('id', topId).single();
        if (!merchant) return null;
        return {
            name: merchant['اسم التاجر'],
            number: merchant['رقم التاجر'],
            activity: merchant['اسم النشاط'],
            total: topAmount
        };
    } catch(e) { return null; }
}

async function getTopMachinesByAchievement(limit = 5) {
    if (!supabase) return [];
    try {
        const { data: machines } = await supabase.from('machines').select('*');
        if (!machines || machines.length === 0) return [];
        const { data: transfers } = await supabase.from('transfers').select('رقم المكنة, قيمة التحويل');
        const achievedMap = new Map();
        if (transfers) {
            transfers.forEach(t => {
                const machineId = t['رقم المكنة'];
                if (machineId) {
                    const amount = parseFloat(t['قيمة التحويل']) || 0;
                    achievedMap.set(machineId, (achievedMap.get(machineId) || 0) + amount);
                }
            });
        }
        const results = machines.map(m => {
            const target = parseFloat(m['التارجت الشهري']) || 0;
            const achieved = achievedMap.get(m['رقم المكنة']) || 0;
            const percentage = target > 0 ? Math.min(100, (achieved / target) * 100) : 0;
            return {
                machineNumber: m['رقم المكنة'],
                merchantName: m['اسم التاجر'],
                target,
                achieved,
                percentage: percentage.toFixed(1)
            };
        });
        results.sort((a, b) => b.percentage - a.percentage);
        return results.slice(0, limit);
    } catch(e) { return []; }
}

async function getLowPerformingMachines() {
    if (!supabase) return [];
    try {
        const { data: machines } = await supabase.from('machines').select('*');
        if (!machines) return [];
        const { data: transfers } = await supabase.from('transfers').select('رقم المكنة, قيمة التحويل');
        const achievedMap = new Map();
        if (transfers) {
            transfers.forEach(t => {
                const machineId = t['رقم المكنة'];
                if (machineId) {
                    achievedMap.set(machineId, (achievedMap.get(machineId) || 0) + (parseFloat(t['قيمة التحويل']) || 0));
                }
            });
        }
        const results = machines.map(m => {
            const target = parseFloat(m['التارجت الشهري']) || 0;
            const achieved = achievedMap.get(m['رقم المكنة']) || 0;
            const percentage = target > 0 ? (achieved / target) * 100 : 100;
            return {
                machineNumber: m['رقم المكنة'],
                merchantName: m['اسم التاجر'],
                percentage: percentage.toFixed(1)
            };
        }).filter(m => m.percentage < 100);
        results.sort((a, b) => a.percentage - b.percentage);
        return results;
    } catch(e) { return []; }
}

async function getPendingRequests() {
    if (!supabase) return 0;
    try {
        const { count, error } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('الحالة', 'معلق');
        if (error) return 0;
        return count;
    } catch(e) { return 0; }
}

function getHelpMessage() {
    return `🤖 **المساعد الذكي يمكنه الإجابة عن:**\n\n` +
           `📊 **الإحصائيات**\n• عدد التجار / المكن\n• إجمالي التحويلات والتحصيلات\n• المتبقي الكلي\n• إحصائيات اليوم\n\n` +
           `🏆 **التحليلات**\n• أعلى تاجر من حيث التحويلات\n• أفضل مكنة تحقيقاً للتارجت\n• المكن التي لم تحقق الهدف\n\n` +
           `📋 **الطلبات**\n• عدد الطلبات المعلقة\n\n` +
           `💡 **نصائح**\n• نصائح لتحسين الأداء\n\n` +
           `📌 **أمثلة على الأسئلة:**\n- كم عدد التجار؟\n- ما هو إجمالي المتبقي؟\n- من هو أعلى تاجر؟\n- ما هي أفضل مكنة؟\n- كم طلب معلق؟\n- أعطني نصيحة لزيادة التحصيلات\n- ما هي إحصائيات اليوم؟`;
}

function getTip() {
    const tips = [
        "💡 نصائح لتحسين التحصيلات: تواصل مع التجار المتأخرين بانتظام وقدم لهم خيارات سداد مرنة.",
        "📈 لرفع أداء المكن: راجع الأجهزة التي لم تحقق التارجت وحلل أسباب ضعف الإقبال عليها.",
        "🎯 حدد أهدافاً شهرية واقعية لكل مكنة بناءً على أدائها السابق لتحفيز المشغلين.",
        "📊 استخدم لوحة التحكم لمتابعة التحويلات اليومية واكتشاف الأنماط الموسمية.",
        "🔔 تفعيل إشعارات الطلبات المعلقة لتسريع معالجتها وتحسين خدمة التجار.",
        "📅 قم بإغلاق الشهر بانتظام لتنظيم البيانات وتحسين أداء الاستعلامات.",
        "👥 شجع التجار على استخدام بوابة التاجر لتقديم الطلبات إلكترونياً وتقليل الأخطاء.",
        "💵 راقب المتبقي الكلي لتجنب تراكم الديون الكبيرة واتخاذ إجراءات مبكرة."
    ];
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
}

// ✅ تصدير باسم processAiQuery للتوافق مع index.html
export const processAiQuery = processQuery;
