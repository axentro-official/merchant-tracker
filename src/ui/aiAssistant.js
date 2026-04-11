// src/ui/aiAssistant.js
// نسخة متطورة مع تصميم متوافق مع index.html

import { processQuery } from '../services/aiService.js';
import { showToast } from './toast.js';

let isOpen = false;
let isLoading = false;
let chatHistory = [];

export function initializeAiAssistant() {
    // إضافة زر المساعد إلى الواجهة إذا لم يكن موجوداً
    if (!document.getElementById('aiAssistantBtn')) {
        const btn = document.createElement('button');
        btn.id = 'aiAssistantBtn';
        btn.className = 'ai-assistant-btn';
        btn.innerHTML = '<i class="fas fa-robot"></i>';
        btn.title = 'المساعد الذكي';
        btn.onclick = toggleAiPanel;
        document.body.appendChild(btn);
        
        // إضافة اللوحة
        const panel = document.createElement('div');
        panel.id = 'aiPanel';
        panel.className = 'ai-panel';
        panel.innerHTML = `
            <div class="ai-header">
                <div class="ai-title"><i class="fas fa-robot"></i> المساعد الذكي Axentro</div>
                <button class="ai-close" onclick="closeAiPanel()"><i class="fas fa-times"></i></button>
            </div>
            <div class="ai-messages" id="aiMessages">
                <div class="ai-message assistant">👋 مرحباً! أنا مساعدك الذكي. اسألني عن أي شيء متعلق بالنظام.</div>
            </div>
            <div class="ai-input-container">
                <textarea id="aiInput" placeholder="اكتب سؤالك هنا..." rows="2" onkeypress="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();sendAiMessage();}"></textarea>
                <button class="ai-send-btn" onclick="sendAiMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
            <div class="ai-footer">
                <button class="ai-clear-btn" onclick="clearChatHistory()"><i class="fas fa-trash-alt"></i> مسح المحادثة</button>
            </div>
        `;
        document.body.appendChild(panel);
        
        // إضافة الأنماط المفقودة للـ AI
        addAiStyles();
    }
}

function addAiStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ai-assistant-btn {
            position: fixed;
            bottom: 24px;
            left: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--purple));
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(59,130,246,0.4);
            z-index: 999;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .ai-assistant-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(59,130,246,0.6);
        }
        .ai-panel {
            position: fixed;
            bottom: 90px;
            left: 24px;
            width: 380px;
            max-width: calc(100vw - 48px);
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            display: flex;
            flex-direction: column;
            z-index: 1000;
            transform: translateX(-120%);
            transition: transform 0.3s ease;
            opacity: 0;
            visibility: hidden;
        }
        .ai-panel.show {
            transform: translateX(0);
            opacity: 1;
            visibility: visible;
        }
        .ai-header {
            padding: 16px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ai-title {
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ai-close {
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 18px;
        }
        .ai-messages {
            height: 400px;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .ai-message {
            padding: 10px 14px;
            border-radius: var(--radius-md);
            max-width: 85%;
            word-wrap: break-word;
            line-height: 1.5;
        }
        .ai-message.user {
            background: var(--primary);
            color: white;
            align-self: flex-end;
            border-bottom-left-radius: 4px;
        }
        .ai-message.assistant {
            background: var(--bg-glass);
            border: 1px solid var(--border-color);
            align-self: flex-start;
            border-bottom-right-radius: 4px;
        }
        .ai-message.assistant strong {
            color: var(--primary-light);
        }
        .ai-typing {
            display: flex;
            gap: 4px;
            align-items: center;
        }
        .ai-typing span {
            width: 8px;
            height: 8px;
            background: var(--text-muted);
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }
        .ai-input-container {
            padding: 12px;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        .ai-input-container textarea {
            flex: 1;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 10px;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            resize: none;
        }
        .ai-input-container textarea:focus {
            outline: none;
            border-color: var(--primary);
        }
        .ai-send-btn {
            width: 38px;
            height: 38px;
            border-radius: var(--radius-md);
            background: var(--primary);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ai-footer {
            padding: 8px 12px;
            border-top: 1px solid var(--border-color);
            text-align: center;
        }
        .ai-clear-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        @media (max-width: 480px) {
            .ai-panel { width: calc(100vw - 32px); left: 16px; bottom: 80px; }
            .ai-assistant-btn { width: 48px; height: 48px; font-size: 20px; bottom: 16px; left: 16px; }
        }
    `;
    document.head.appendChild(style);
}

export function toggleAiPanel() {
    const panel = document.getElementById('aiPanel');
    const btn = document.getElementById('aiAssistantBtn');
    if (!panel) return;
    isOpen = !isOpen;
    if (isOpen) {
        panel.classList.add('show');
        if (btn) btn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.getElementById('aiInput')?.focus();
        }, 300);
    } else {
        panel.classList.remove('show');
        if (btn) btn.style.transform = '';
    }
}

export function closeAiPanel() {
    const panel = document.getElementById('aiPanel');
    const btn = document.getElementById('aiAssistantBtn');
    if (panel) panel.classList.remove('show');
    if (btn) btn.style.transform = '';
    isOpen = false;
}

export async function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const message = input?.value?.trim();
    if (!message || isLoading) return;
    
    input.value = '';
    addMessage('user', message);
    showTypingIndicator(true);
    isLoading = true;
    
    try {
        const response = await processQuery(message);
        addMessage('assistant', formatResponse(response));
        // حفظ التاريخ
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: response });
        if (chatHistory.length > 30) chatHistory = chatHistory.slice(-30);
        if (window.Sound) window.Sound.play('success');
    } catch (error) {
        addMessage('assistant', '❌ عذراً، حدث خطأ أثناء معالجة سؤالك. حاول مرة أخرى.');
    } finally {
        showTypingIndicator(false);
        isLoading = false;
    }
}

function addMessage(role, content) {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `ai-message ${role}`;
    div.innerHTML = content;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator(show) {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    const existing = container.querySelector('.ai-typing-wrapper');
    if (existing) existing.remove();
    if (show) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message assistant ai-typing-wrapper';
        wrapper.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
    }
}

function formatResponse(text) {
    // تحويل النص إلى HTML مع دعم **للخط العريض**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br>');
    formatted = formatted.replace(/• /g, '• ');
    return formatted;
}

export function clearChatHistory() {
    const container = document.getElementById('aiMessages');
    if (container) {
        container.innerHTML = '<div class="ai-message assistant">🧹 تم مسح المحادثة. كيف يمكنني مساعدتك الآن؟</div>';
    }
    chatHistory = [];
}

// ربط الدوال للنافذة العامة
window.toggleAiPanel = toggleAiPanel;
window.closeAiPanel = closeAiPanel;
window.sendAiMessage = sendAiMessage;
window.clearChatHistory = clearChatHistory;
