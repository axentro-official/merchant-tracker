/**
 * AI Assistant UI Component
 * Manages the chat-like interface for AI interactions
 * @version 1.0.0
 */

import { processQuery } from '../services/aiService.js';
import { playSound } from './soundManager.js';

// ============================================================
// STATE
// ============================================================

let isOpen = false;
let isLoading = false;

// Message history for context
const messageHistory = [];

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize AI Assistant component
 */
export function initializeAiAssistant() {
    console.log('🤖 AI Assistant initialized');
    
    // Setup initial welcome message
    addWelcomeMessage();
}

/**
 * Add welcome message to chat
 */
function addWelcomeMessage() {
    const messagesContainer = document.getElementById('aiMessages');
    if (!messagesContainer) return;
    
    // Keep existing welcome message if present
    if (messagesContainer.querySelector('.assistant')) return;
    
    const welcomeMsg = createMessageElement('assistant', 
        `<strong>مرحباً! 👋</strong><br>` +
        `أنا مساعدك الذكي. يمكنني مساعدتك في:<br>` +
        `• معرفة أعلى تاجر<br>` +
        `• إجمالي التحصيلات<br>` +
        `• عدد التجار والمكن<br>` +
        `• تحليل البيانات البسيط<br><br>` +
        `كيف يمكنني مساعدتك؟`
    );
    
    messagesContainer.appendChild(welcomeMsg);
}

// ============================================================
// UI CONTROL FUNCTIONS
// ============================================================

/**
 * Toggle AI panel visibility
 */
export function toggleAiPanel() {
    const panel = document.getElementById('aiPanel');
    const toggleBtn = document.getElementById('aiToggleBtn');
    
    if (!panel) return;
    
    isOpen = !isOpen;
    
    if (isOpen) {
        panel.classList.add('show');
        toggleBtn?.classList.add('active');
        playSound('done');
        
        // Focus input
        setTimeout(() => {
            document.getElementById('aiInput')?.focus();
        }, 300);
    } else {
        panel.classList.remove('show');
        toggleBtn?.classList.remove('active');
    }
}

/**
 * Close AI panel
 */
export function closeAiPanel() {
    const panel = document.getElementById('aiPanel');
    const toggleBtn = document.getElementById('aiToggleBtn');
    
    if (panel) {
        panel.classList.remove('show');
        toggleBtn?.classList.remove('active');
        isOpen = false;
    }
}

// ============================================================
// MESSAGE HANDLING
// ============================================================

/**
 * Send user message and get AI response
 */
export async function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const message = input?.value?.trim();
    
    if (!message || isLoading) return;
    
    // Clear input
    input.value = '';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator(true);
    isLoading = true;
    
    try {
        // Process query (with small delay for natural feel)
        const [response] = await Promise.all([
            processQuery(message),
            delay(500 + Math.random() * 1000) // Simulate thinking time
        ]);
        
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Add AI response
        addMessage('assistant', formatResponse(response));
        
        // Play subtle sound
        playSound('done');
        
        // Save to history
        messageHistory.push({ role: 'user', content: message });
        messageHistory.push({ role: 'assistant', content: response });
        
        // Limit history size
        if (messageHistory.length > 20) {
            messageHistory.splice(0, messageHistory.length - 20);
        }
        
    } catch (error) {
        showTypingIndicator(false);
        addMessage('assistant', '❌ عذراً، حدث خطأ. حاول مرة أخرى.');
        console.error('AI Error:', error);
    } finally {
        isLoading = false;
    }
}

/**
 * Add message to chat
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content (HTML allowed)
 */
function addMessage(role, content) {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    
    const msgElement = createMessageElement(role, content);
    container.appendChild(msgElement);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Create message DOM element
 * @param {string} role - Message role
 * @param {string} content - Message content
 * @returns {HTMLElement} Message element
 */
function createMessageElement(role, content) {
    const div = document.createElement('div');
    div.className = `ai-message ${role}`;
    div.innerHTML = content;
    return div;
}

/**
 * Format AI response (convert markdown-like syntax to HTML)
 * @param {string} response - Raw response text
 * @returns {string} Formatted HTML
 */
function formatResponse(response) {
    if (!response) return '';
    
    // Convert markdown bold to HTML
    let formatted = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Convert bullet points
    formatted = formatted.replace(/• /g, '• ');
    
    return formatted;
}

/**
 * Show/hide typing indicator
 * @param {boolean} show - Whether to show indicator
 */
function showTypingIndicator(show) {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    
    // Remove existing indicator
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

// ============================================================
// UTILITY
// ============================================================

/**
 * Delay helper
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clear chat history
 */
export function clearChatHistory() {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    
    container.innerHTML = '';
    messageHistory.length = 0;
    
    addWelcomeMessage();
}
