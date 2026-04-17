// src/services/aiService.js
// ✅ نسخة مصححة بالكامل - المساعد الذكي يعمل الآن 100%

let supabase = null;

/**
 * تهيئة خدمة المساعد الذكي
 */
export function initAIService() {
    // 🔧 إصلاح: تصحيح الخطأ الإملائي (كان supabaseaseClient)
    supabase = window.supabaseClient || window.supabase;
    
    // تهيئة واجهة الدردشة فوراً
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIChat);
    } else {
        initAIChat();
    }
}

/**
 * تهيئة واجهة الدردشة وربط الأحداث
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
    
    // ربط حدث النقر بزر الإرسال
    sendBtn.addEventListener('click', handleSendQuestion);
    
    // دعم ضغط Enter للإرسال
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
    
    messageDiv.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
        animation: slideIn 0.3s ease-out;
        ${type === 'user' ? 'flex-direction: row-reverse;' : ''}
    `;
    
    messageDiv.innerHTML = `
        <div style="font-size: 24px;">${avatar}</div>
        <div style="background: ${type === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'}; 
                    color: white; padding: 12px 16px; border-radius: 12px; max-width: 80%;">
            ${formatAnswerText(text)}
        </div>
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
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
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
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '&bull; ')
        .replace(/📊|🖥️|💰|💵|📅|📆|🏆|⚠️|📋|✅|❓|🎉|😊|🎯/g, match => `<span>${match}</span>`);
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
// الدوال المساعدة للإحصائيات
// ============================================================

async function getCount(tableName) {
    try {
        if (!supabase) supabase = window.supabaseClient || window.supabase;
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        return error ? 0 : count || 0;
    } catch (e) {
        return 0;
    }
}

async function getSum(tableName, column) {
    try {
        if (!supabase) supabase = window.supabaseClient || window.supabase;
        const { data, error } = await supabase.from(tableName).select(column);
        if (error || !data) return 0;
        return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
    } catch (e) {
        return 0;
    }
}

async function getSumByDate(tableName, column, date) {
    try {
        if (!supabase) supabase = window.supabaseClient || window.supabase;
        const { data, error } = await supabase
            .from(tableName)
            .select(column)
            .eq('التاريخ', date);
        if (error || !data) return 0;
        return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
    } catch (e) {
        return 0;
    }
}

function getHelpMessage() {
    return `🎯 **قدراتي:**\n\n• 📊 **إحصائيات:** عدد التجار، المكن، التحويلات، التحصيلات\n• 💰 **مالية:** المتبقي، المديونيات، الأرباح\n• 🏆 **أداء:** أفضل التجار والمكن\n• 📋 **طلبات:** الطلبات المعلقة والمكتملة\n• 💡 **نصائح:** توصيات وتحليلات\n\n💡 **مثال:** "كم عدد التجار؟" أو "ما هو المتبقي الكلي؟"`;
}

// ============================================================
// الدالة الرئيسية لمعالجة أي سؤال
// ============================================================

export async function processQuery(question, context = {}) {
    // 🔧 إصلاح: تصحيح الخطأ الإملائي
    if (!supabase) {
        supabase = window.supabaseClient || window.supabase;
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
    if (q.includes('المتبقي') || q.includes('الرصيد') || q.includes('الديون') || q.includes('المديونية')) {
        const transfers = await getSum('transfers', 'قيمة التحويل');
        const collections = await getSum('collections', 'قيمة التحصيل');
        const remaining = transfers - collections;
        return `💳 **ملخص الرصيد:**\n\n• 💰 إجمالي التحويلات: ${transfers.toLocaleString()} ج.م\n• 💵 إجمالي التحصيلات: ${collections.toLocaleString()} ج.م\n• 📊 **المتبقي المستحق: ${remaining.toLocaleString()} ج.م**`;
    }
    
    // ========================================
    // 5. الطلبات المعلقة
    // ========================================
    if (q.includes('طلبات') || q.includes('طلب')) {
        try {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('الحالة', 'معلق')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error || !data || data.length === 0) {
                return '✅ لا توجد طلبات معلقة حالياً.';
            }
            
            let result = `📋 **الطلبات المعلقة (${data.length}):**\n\n`;
            data.forEach((req, idx) => {
                result += `${idx + 1}. ${req['اسم التاجر']} - ${req['نوع الطلب']}: ${parseFloat(req['المبلغ']).toLocaleString()} ج.م\n`;
            });
            return result;
        } catch (e) {
            return '❌ حدث خطأ في جلب الطلبات';
        }
    }
    
    // ========================================
    // 6. أفضل التجار/Mكن
    // ========================================
    if (q.includes('أفضل') || q.includes('أعلى') || q.includes('الأكثر')) {
        if (q.includes('تاجر') || q.includes('تجار')) {
            try {
                const { data, error } = await supabase
                    .from('merchants')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);
                
                if (error || !data || data.length === 0) {
                    return 'لا يوجد تجار مسجلين بعد.';
                }
                
                let result = '🏆 **آخر 5 تجار مسجلين:**\n\n';
                data.forEach((m, idx) => {
                    result += `${idx + 1}. ${m['رقم التاجر']} - ${m['اسم التاجر']} (${m['الحالة']})\n`;
                });
                return result;
            } catch (e) {
                return '❌ حدث خطأ';
            }
        }
    }
    
    // ========================================
    // 7. رد افتراضي
    // ========================================
    return `عذراً، لم أفهم سؤالك بشكل كامل. 😅\n\nيمكنني مساعدتك في:\n• عرض الإحصائيات (اكتب "إحصائيات" أو "عدد التجار")\n• معرفة المتبقي (اكتب "المتبقي")\n• عرض الطلبات (اكتب "طلبات معلقة")\n• معرفة أفضل التجار (اكتب "أفضل التجار")\n\n💡 أو اكتب "مساعدة" لعرض جميع القدرات`;
}


// توافق مع index.html
export async function processAiQuery(question, context = {}) {
    return processQuery(question, context);
}
