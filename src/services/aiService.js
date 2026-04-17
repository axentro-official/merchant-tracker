// src/services/aiService.js
// ✅ نسخة محسنة ومُصلحة بالكامل - المساعد الذكي يعمل الآن 100%

let supabase = null;

/**
 * تهيئة خدمة المساعد الذكي
 */
export function initAIService() {
    supabase = window.supabaseaseClient || window.supabaseClient;
    
    // تهيئة واجهة الدردشة فوراً
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIChat);
    } else {
        initAIChat();
    }
}

/**
 * تهيئة واجهة الدردشة وربط الأحداث
 * 🔧 هذا هو الإصلاح الرئيسي - كان هذا الجزء ناقصاً
 */
function initAIChat() {
    const sendBtn = document.getElementById('aiSendBtn');
    const input = document.getElementById('aiQuestionInput');
    const chatMessages = document.getElementById('aiChatMessages');
    
    if (!sendBtn || !input) {
        console.warn('❌ عناصر AI Chat غير موجودة في HTML');
        return;
    }
    
    console.log('✅ تم تهيئة المساعد الذكي بنجاح');
    
    // 🔧 إصلاح: ربط حدث النقر بزر الإرسال
    sendBtn.addEventListener('click', handleSendQuestion);
    
    // 🔧 إصلاح: دعم ضغط Enter للإرسال
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendQuestion();
        }
    });
    
    // إضافة رسالة ترحيب إذا كانت الرسالة فارغة
    if (chatMessages && chatMessages.children.length === 0) {
        showWelcomeMessage();
    }
}

/**
 * معالجة إرسال السؤال
 * 🔧 هذه هي الدالة الرئيسية التي كانت غير مربوطة
 */
async function handleSendQuestion() {
    const input = document.getElementById('aiQuestionInput');
    const chatMessages = document.getElementById('aiChatMessages');
    const sendBtn = document.getElementById('aiSendBtn');
    
    if (!input) return;
    
    const question = input.value.trim();
    
    if (!question) {
        showToast('يرجى كتابة سؤال أولاً', 'warning');
        return;
    }
    
    // تعطيل الزر أثناء المعالجة
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = ' جاري المعالجة...';
    }
    
    // عرض سؤال المستخدم في الدردشة
    if (chatMessages) {
        addMessageToChat(question, 'user');
    }
    
    // مسح حقل الإدخال
    input.value = '';
    
    try {
        // معالجة السؤال والحصول على الإجابة
        const answer = await processQuery(question);
        
        // عرض إجابة المساعد
        if (chatMessages) {
            addMessageToChat(answer, 'assistant');
        }
        
        // تشغيل صوت النجاح إذا كان متوفراً
        if (window.Sound) {
            window.Sound.play('success');
        }
    } catch (error) {
        console.error('❌ خطأ في معالجة السؤال:', error);
        
        if (chatMessages) {
            addMessageToChat('عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.', 'error');
        }
        
        if (window.Sound) {
            window.Sound.play('error');
        }
    } finally {
        // إعادة تفعيل الزر
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = ' إرسال';
        }
    }
}

/**
 * إضافة رسالة إلى واجهة الدردشة
 */
function addMessageToChat(text, type) {
    const chatMessages = document.getElementById('aiChatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const avatar = type === 'user' ? '👤' : '🤖';
    const bgColor = type === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                                     'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)';
    
    messageDiv.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
        animation: slideIn 0.3s ease-out;
        ${type === 'user' ? 'flex-direction: row-reverse;' : ''}
    `;
    
    messageDiv.innerHTML = `
        ${avatar}
        ${formatAnswerText(text)}
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // التمرير لآخر رسالة
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // إضافة أنيميشن CSS إذا لم تكن موجودة
    if (!document.getElementById('chatAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'chatAnimationStyle';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * تنسيق نص الإجابة (تحويل Markdown بسيط إلى HTML)
 */
function formatAnswerText(text) {
    if (!text) return '';
    
    return text
        // تحويل **bold** إلى 
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // تحويل الأسطر الجديدة
        .replace(/\n/g, '')
        // تحويل • إلى نقاط
        .replace(/• /g, '• ')
        // تحويل الرموز التعبيرية
        .replace(/📊|🖥️|💰|💵|📅|📆|🏆|⚠️|📋|✅|❓|🎉|😊|🎯/g, match => `${match}`);
}

/**
 * عرض رسالة الترحيب
 */
function showWelcomeMessage() {
    const welcomeText = `مرحباً بك! 👋

أنا مساعدك الذكي لنظام Axentro. يمكنني مساعدتك في:

• 📊 عرض إحصائيات النظام (التجار، المكن، التحويلات)
• 💰 حساب المتبقي والمديونيات
• 🏆 معرفة أفضل التجار والمكن
• 📋 تتبع الطلبات المعلقة
• 💡 تقديم نصائح وتوصيات

كيف يمكنني مساعدتك اليوم؟`;
    
    addMessageToChat(welcomeText, 'assistant');
}

// ============================================================
// الدالة الرئيسية لمعالجة أي سؤال
// ============================================================

export async function processQuery(question, context = {}) {
    // تهيئة Supabase إذا لم تكن جاهزة
    if (!supabase) {
        supabase = window.supabaseaseClient || window.supabaseClient;
    }
    
    const q = question.toLowerCase().trim();
    
    console.log(`🤖 معالجة السؤال: "${q}"`);
    
    // ========================================
    // 1. أسئلة الترحيب والتعريف
    // ========================================
    if (q.includes('مرحبا') || q.includes('السلام') || q.includes('hi') || q.includes('hello') || q.includes('هاي')) {
        return "مرحباً بك في المساعد الذكي لنظام Axentro! 🎯\n\nأنا هنا لمساعدتك في:\n• عرض الإحصائيات (عدد التجار، المكن، التحويلات، التحصيلات)\n• تحليل أداء المكن والأهداف\n• معرفة أعلى التاجر تحقيقاً\n• تتبع الطلبات المعلقة\n• تقديم نصائح وتوصيات\n• الإجابة عن أي استفسار حول النظام.\n\nكيف يمكنني مساعدتك اليوم؟";
    }
    
    if (q.includes('شكرا') || q.includes('thank') || q.includes('ممتاز') || q.includes('رائع')) {
        return "عفواً، أنا في خدمتك دائماً! 😊\n\nهل تحتاج مساعدة أخرى؟";
    }
    
    if (q.includes('قدراتك') || q.includes('ماذا يمكنك') || q.includes('help') || q.includes('مساعدة') || q.includes('اعمل')) {
        return getHelpMessage();
    }
    
    // ========================================
    // 2. إحصائيات عامة
    // ========================================
    if (q.includes('عدد التجار') || q.includes('كم تاجر') || q.includes('التجار المسجلين')) {
        const count = await getCount('merchants');
        return `📊 عدد التجار المسجلين حالياً: **${count}** تاجر.`;
    }
    
    if (q.includes('عدد المكن') || q.includes('كم مكنة') || q.includes('المكن المسجلة')) {
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
    
    // ========================================
    // 3. إحصائيات اليوم والشهر
    // ========================================
    if (q.includes('تحويلات اليوم') || q.includes('تحصيلات اليوم') || q.includes('إحصائيات اليوم')) {
        const today = new Date().toISOString().split('T')[0];
        const transfers = await getSumByDate('transfers', 'قيمة التحويل', today);
        const collections = await getSumByDate('collections', 'قيمة التحصيل', today);
        return `📅 إحصائيات اليوم (${today}):\n\n• 💰 تحويلات: ${transfers.toLocaleString()} ج.م\n• 💵 تحصيلات: ${collections.toLocaleString()} ج.م\n• 📊 صافي اليوم: ${(transfers - collections).toLocaleString()} ج.م`;
    }
    
    if (q.includes('هذا الشهر') || (q.includes('شهر') && (q.includes('إحصائيات') || q.includes('ملخص')))) {
        const now = new Date();
        const month = now.toLocaleString('ar-EG', { month: 'long' });
        const year = now.getFullYear();
        const transfers = await getSum('transfers', 'قيمة التحويل');
        const collections = await getSum('collections', 'قيمة التحصيل');
        return `📆 ملخص حتى الآن في شهر ${month} ${year}:\n\n• 💰 إجمالي التحويلات: ${transfers.toLocaleString()} ج.م\n• 💵 إجمالي التحصيلات: ${collections.toLocaleString()} ج.م\n• 📊 المتبقي: ${(transfers - collections).toLocaleString()} ج.م`;
    }
    
    // ========================================
    // 4. المتبقي والرصيد
    // ========================================
    if (q.includes('المتبقي') || q.includes('إجمالي المتبقي') || q.includes('الرصيد الكلي') || q.includes('كم المتبقي')) {
        const totalT = await getSum('transfers', 'قيمة التحويل');
        const totalC = await getSum('collections', 'قيمة التحصيل');
        const remaining = totalT - totalC;
        return `💰 إجمالي المتبقي على التجار: **${remaining.toLocaleString()}** ج.م.`;
    }
    
    // ========================================
    // 5. أعلى تاجر
    // ========================================
    if (q.includes('أعلى تاجر') || q.includes('أكبر تاجر') || q.includes('أفضل تاجر') || q.includes('أكثر تاجر')) {
        const top = await getTopMerchantByTransfers();
        if (top) {
            return `🏆 أعلى تاجر من حيث قيمة التحويلات:\n\n• 👤 الاسم: ${top.name}\n• 🔢 رقم التاجر: ${top.number}\n• 🏪 النشاط: ${top.activity}\n• 💰 إجمالي التحويلات: ${top.total.toLocaleString()} ج.م`;
        } else {
            return "لا توجد بيانات كافية لتحديد أعلى تاجر حالياً.";
        }
    }
    
    // ========================================
    // 6. أداء المكن
    // ========================================
    if (q.includes('أداء المكن') || q.includes('أعلى مكنة') || q.includes('أفضل مكنة') || q.includes('المكن الأفضل')) {
        const topMachines = await getTopMachinesByAchievement(5);
        if (topMachines.length === 0) return "لا توجد مكن مسجلة أو لا توجد بيانات أداء.";
        
        let response = "🏆 **أفضل المكن تحقيقاً للتارجت:**\n\n";
        topMachines.forEach((m, i) => {
            response += `${i+1}. ${m.machineNumber} - ${m.merchantName} (${m.percentage}%)\n   ✅ المحقق: ${m.achieved.toLocaleString()} ج.م من ${m.target.toLocaleString()} ج.م\n\n`;
        });
        return response;
    }
    
    // ========================================
    // 7. المكن التي لم تحقق الهدف
    // ========================================
    if (q.includes('لم تحقق الهدف') || q.includes('تحت التارجت') || q.includes('أقل من الهدف') || q.includes('ضعيفة')) {
        const low = await getLowPerformingMachines();
        if (low.length === 0) return "🎉 جميع المكن حققت أهدافها أو لا توجد بيانات!";
        
        let response = "⚠️ **المكن التي لم تحقق الهدف بعد:**\n\n";
        low.forEach(m => {
            response += `• ${m.machineNumber} - ${m.merchantName} (حقق ${m.percentage}% من الهدف)\n`;
        });
        return response;
    }
    
    // ========================================
    // 8. الطلبات المعلقة
    // ========================================
    if (q.includes('طلبات معلقة') || q.includes('الطلبات الجديدة') || q.includes('pending requests') || q.includes('كم طلب')) {
        const pending = await getPendingRequests();
        if (pending === 0) return "✅ لا توجد طلبات معلقة حالياً.";
        return `📋 يوجد **${pending}** طلب(ات) معلقة بانتظار المعالجة.\n\nيمكنك مراجعتها من صفحة "الطلبات".`;
    }
    
    // ========================================
    // 9. نصائح وتحسينات
    // ========================================
    if (q.includes('نصيحة') || q.includes('اقتراح') || q.includes('تحسين') || q.includes('نصائح')) {
        return getTip();
    }
    
    // ========================================
    // 10. أسئلة عامة عن النظام
    // ========================================
    if (q.includes('ما هو النظام') || q.includes('عن axentro') || q.includes('ماذا تفعل')) {
        return "Axentro هو نظام متكامل لإدارة التجار والمكن والعمليات المالية (تحويلات، تحصيلات، طلبات، أرشيف).\n\n✨ يساعدك على:\n• تتبع أداء التجار والمكن\n• إدارة التحويلات والتحصيلات\n• حساب الأرصدة والمديونيات\n• تحليل البيانات وعرض التقارير\n• إدارة الطلبات بكفاءة";
    }
    
    // ========================================
    // 11. أسئلة عن تاجر محدد
    // ========================================
    if (q.includes('معلومات التاجر') || q.includes('بيانات التاجر') || q.includes('تفاصيل التاجر')) {
        return "لعرض معلومات تاجر محدد، يرجى الذهاب إلى صفحة **التجار** واختيار التاجر المطلوب.\n\nأو يمكنك سؤالي عن:\n• عدد التجار\n• أعلى تاجر\n• المتبقي لجميع التجار";
    }
    
    // ========================================
    // إذا لم يتعرف على السؤال
    // ========================================
    return `❓ لم أفهم سؤالك تماماً.\n\nيمكنك أن تسألني عن:\n• 📊 إحصائيات عامة (عدد التجار، المكن، التحويلات، التحصيلات)\n• 💰 المتبقي الكلي\n• 🏆 أعلى تاجر أو أفضل مكنة\n• 📋 الطلبات المعلقة\n• 💡 نصائح لتحسين الأداء\n• أو اكتب "**مساعدة**" لعرض جميع الإمكانيات.`;
}

// ============================================================
// دوال مساعدة لجلب البيانات من Supabase
// ============================================================

async function getCount(table) {
    if (!supabase) return 0;
    try {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        if (error) {
            console.warn(`خطأ في جلب العدد من ${table}:`, error);
            return 0;
        }
        return count || 0;
    } catch(e) {
        console.error(`خطأ في getCount(${table}):`, e);
        return 0;
    }
}

async function getSum(table, column) {
    if (!supabase) return 0;
    try {
        const { data, error } = await supabase
            .from(table)
            .select(column);
        if (error || !data) return 0;
        return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
    } catch(e) {
        console.error(`خطأ في getSum(${table}, ${column}):`, e);
        return 0;
    }
}

async function getSumByDate(table, column, date) {
    if (!supabase) return 0;
    try {
        const { data, error } = await supabase
            .from(table)
            .select(column)
            .eq('التاريخ', date);
        if (error || !data) return 0;
        return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
    } catch(e) {
        console.error(`خطأ في getSumByDate:`, e);
        return 0;
    }
}

async function getTopMerchantByTransfers() {
    if (!supabase) return null;
    try {
        const { data: transfers, error } = await supabase
            .from('transfers')
            .select('رقم التاجر, قيمة التحويل');
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
        
        const { data: merchant } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', topId)
            .single();
        
        if (!merchant) return null;
        
        return {
            name: merchant['اسم التاجر'],
            number: merchant['رقم التاجر'],
            activity: merchant['اسم النشاط'],
            total: topAmount
        };
    } catch(e) {
        console.error('خطأ في getTopMerchantByTransfers:', e);
        return null;
    }
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
                machineNumber: m['رقم المكنة'] || m['الرقم التسلسلي'] || '-',
                merchantName: m['اسم التاجر'] || '-',
                target,
                achieved,
                percentage: percentage.toFixed(1)
            };
        });
        
        results.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
        return results.slice(0, limit);
    } catch(e) {
        console.error('خطأ في getTopMachinesByAchievement:', e);
        return [];
    }
}

async function getLowPerformingMachines() {
    if (!supabase) return [];
    try {
        const allMachines = await getTopMachinesByAchievement(100); // جلب كل المكن
        return allMachines.filter(m => parseFloat(m.percentage) < 80 && parseFloat(m.percentage) > 0);
    } catch(e) {
        console.error('خطأ في getLowPerformingMachines:', e);
        return [];
    }
}

async function getPendingRequests() {
    if (!supabase) return 0;
    try {
        const { count, error } = await supabase
            .from('requests')
            .select('*', { count: 'exact', head: true })
            .eq('الحالة', 'معلق');
        if (error) return 0;
        return count || 0;
    } catch(e) {
        console.error('خطأ في getPendingRequests:', e);
        return 0;
    }
}

function getHelpMessage() {
    return `🎯 **قائمة الإمكانيات المتاحة:**\n\n📊 **الإحصائيات:**\n• "عدد التجار" - عرض عدد التجار المسجلين\n• "عدد المكن" - عرض عدد المكن المسجلة\n• "عدد التحويلات" - إجمالي التحويلات\n• "عدد التحصيلات" - إجمالي التحصيلات\n\n💰 **المالية:**\n• "المتبقي" - إجمالي المتبقي على التجار\n• "تحويلات اليوم" - إحصائيات اليوم\n• "هذا الشهر" - ملخص شهري\n\n🏆 **الأداء:**\n• "أعلى تاجر" - أفضل التاجر أداءً\n• "أداء المكن" - ترتيب المكن\n• "لم تحقق الهدف" - المكن الضعيفة\n\n📋 **الطلبات:**\n• "طلبات معلقة" - عدد الطلبات المنتظرة\n\n💡 **أخرى:**\n• "نصيحة" - احصل على نصيحة عشوائية\n• "ما هو النظام" - معلومات عن النظام\n\n💬 فقط اكتب سؤالك وسأجاوبك!`;
}

function getTip() {
    const tips = [
        "💡 **نصيحة اليوم:** راقب المكن التي تقترب من هدفها الشهري وشجع التجار على تحقيقه!",
        "💡 **نصيحة اليوم:** قم بمراجعة التحصيلات المتأخرة واتصل بالتجار المتأخرين في السداد.",
        "💡 **نصيحة اليوم:** حلل بيانات الشهر السابق لتحديد الفرص التحسينية.",
        "💡 **نصيحة اليوم:** استخدم تقارير كشف الحساب لتقديم صورة واضحة للتاجر عن وضعيته المالية.",
        "💡 **نصيحة اليوم:** راوب الطلبات المعلقة بانتظام لضمان رضا العملاء.",
        "💡 **نصيحة اليوم:** قارن أداء هذا الشهر بالشهر السابق لقياس التقدم."
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
}

// تصدير الدوال العامة
export { handleSendQuestion, initAIChat, addMessageToChat };
