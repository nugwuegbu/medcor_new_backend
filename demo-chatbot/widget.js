// Medcor AI Chat Widget - Standalone Version
// Include this script in any website to add the chat widget

(function() {
    // Chat Widget CSS
    const widgetCSS = `
        .medcor-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 384px;
            height: 600px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .medcor-chat-widget.minimized {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .medcor-chat-header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }
        
        .medcor-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .medcor-chat-icon {
            width: 24px;
            height: 24px;
            background: rgba(255,255,255,0.2);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        
        .medcor-header-title {
            font-size: 16px;
            font-weight: 600;
        }
        
        .medcor-avatar-circle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
            margin-left: auto;
        }
        
        .medcor-brand-name {
            font-size: 18px;
            font-weight: 700;
            color: #8b5cf6;
            text-align: center;
            flex: 1;
        }
        
        .medcor-close-button {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            opacity: 0.8;
        }
        
        .medcor-close-button:hover {
            opacity: 1;
        }
        
        .medcor-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .medcor-message {
            max-width: 85%;
            word-wrap: break-word;
            line-height: 1.4;
            white-space: pre-wrap;
        }
        
        .medcor-message.user {
            background: #8b5cf6;
            color: white;
            padding: 12px 16px;
            border-radius: 18px 18px 4px 18px;
            margin-left: auto;
            font-size: 14px;
        }
        
        .medcor-message.bot {
            background: white;
            color: #1f2937;
            padding: 12px 16px;
            border-radius: 18px 18px 18px 4px;
            margin-right: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            font-size: 14px;
        }
        
        .medcor-typing-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: white;
            border-radius: 18px 18px 18px 4px;
            margin-right: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            max-width: 85%;
        }
        
        .medcor-typing-text {
            font-size: 14px;
            color: #6b7280;
        }
        
        .medcor-typing-dots {
            display: flex;
            gap: 3px;
        }
        
        .medcor-typing-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #9ca3af;
            animation: medcor-typing 1.4s infinite;
        }
        
        .medcor-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .medcor-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes medcor-typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }
        
        .medcor-input-container {
            padding: 16px 20px 20px 20px;
            background: white;
            border-top: 1px solid #e5e7eb;
        }
        
        .medcor-input-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f3f4f6;
            border-radius: 25px;
            padding: 8px 12px;
            border: 2px solid transparent;
            transition: border-color 0.2s;
        }
        
        .medcor-input-wrapper:focus-within {
            border-color: #8b5cf6;
            background: white;
        }
        
        .medcor-input-field {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 14px;
            color: #1f2937;
            padding: 4px 8px;
        }
        
        .medcor-input-field::placeholder {
            color: #9ca3af;
        }
        
        .medcor-send-button {
            background: #8b5cf6;
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 16px;
        }
        
        .medcor-send-button:hover {
            background: #7c3aed;
        }
        
        .medcor-send-button:disabled {
            background: #d1d5db;
            cursor: not-allowed;
        }
        
        .medcor-mic-button {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: color 0.2s;
            font-size: 20px;
        }
        
        .medcor-mic-button:hover {
            color: #8b5cf6;
        }
        
        .medcor-mic-button.recording {
            color: #ef4444;
            animation: medcor-pulse 1s infinite;
        }
        
        @keyframes medcor-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .medcor-lightbulb-button {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: #8b5cf6;
            color: white;
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            transition: all 0.2s;
            font-size: 20px;
        }
        
        .medcor-lightbulb-button:hover {
            background: #7c3aed;
            transform: translateX(-50%) scale(1.05);
        }
        
        .medcor-progress-bar {
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 8px;
        }
        
        .medcor-progress-fill {
            height: 100%;
            background: #fbbf24;
            border-radius: 2px;
            transition: width 0.3s ease;
        }
        
        .medcor-menu-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        
        .medcor-menu-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            padding: 20px;
        }
        
        .medcor-menu-item {
            background: white;
            border: none;
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .medcor-menu-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        
        .medcor-menu-icon {
            font-size: 24px;
            color: #8b5cf6;
        }
        
        .medcor-menu-text {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
        }
        
        .medcor-toggle-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
            transition: all 0.3s ease;
            z-index: 9999;
        }
        
        .medcor-toggle-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
        }
        
        /* Scrollbar styling */
        .medcor-chat-messages::-webkit-scrollbar {
            width: 4px;
        }
        
        .medcor-chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .medcor-chat-messages::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 2px;
        }
        
        .medcor-chat-messages::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
    `;

    // Chat Widget Class
    class MedcorChatWidget {
        constructor(options = {}) {
            this.isOpen = false;
            this.isLoading = false;
            this.isRecording = false;
            this.sessionId = 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.messages = [
                {
                    id: 1,
                    text: "Merhaba! Size nasıl yardımcı olabilirim? Randevu almak, doktor bilgilerini öğrenmek veya sağlık sorularınız için buradayım.",
                    sender: 'bot',
                    timestamp: new Date()
                }
            ];
            this.showMenu = false;
            this.progress = 0;
            
            // Configuration
            this.config = {
                apiUrl: options.apiUrl || 'https://api.medcor.com',
                position: options.position || 'bottom-right',
                theme: options.theme || 'purple',
                language: options.language || 'tr',
                ...options
            };
            
            this.init();
        }
        
        init() {
            this.injectCSS();
            this.createWidget();
            this.bindEvents();
        }
        
        injectCSS() {
            const style = document.createElement('style');
            style.textContent = widgetCSS;
            document.head.appendChild(style);
        }
        
        createWidget() {
            // Create toggle button
            this.toggleButton = document.createElement('button');
            this.toggleButton.className = 'medcor-toggle-button';
            this.toggleButton.innerHTML = '💬';
            document.body.appendChild(this.toggleButton);
            
            // Create widget container
            this.widget = document.createElement('div');
            this.widget.className = 'medcor-chat-widget';
            this.widget.style.display = 'none';
            
            this.widget.innerHTML = `
                <div class="medcor-chat-header">
                    <div class="medcor-header-left">
                        <div class="medcor-chat-icon">💬</div>
                        <div class="medcor-header-title">AI Assistant</div>
                    </div>
                    <div class="medcor-brand-name">medcor</div>
                    <div class="medcor-avatar-circle">👩‍⚕️</div>
                    <button class="medcor-close-button">×</button>
                    <div class="medcor-progress-bar" style="display: none;">
                        <div class="medcor-progress-fill"></div>
                    </div>
                </div>
                
                <div class="medcor-chat-messages">
                    <!-- Messages will be inserted here -->
                </div>
                
                <div class="medcor-input-container">
                    <div class="medcor-input-wrapper">
                        <input 
                            type="text" 
                            class="medcor-input-field" 
                            placeholder="Send your message..."
                        />
                        <button class="medcor-mic-button">🎤</button>
                        <button class="medcor-send-button">↗️</button>
                    </div>
                </div>
                
                <button class="medcor-lightbulb-button">💡</button>
            `;
            
            document.body.appendChild(this.widget);
            this.renderMessages();
        }
        
        bindEvents() {
            // Toggle button
            this.toggleButton.addEventListener('click', () => this.toggle());
            
            // Close button
            this.widget.querySelector('.medcor-close-button').addEventListener('click', () => this.close());
            
            // Send button
            this.widget.querySelector('.medcor-send-button').addEventListener('click', () => this.sendMessage());
            
            // Input field
            const input = this.widget.querySelector('.medcor-input-field');
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
            
            // Mic button
            this.widget.querySelector('.medcor-mic-button').addEventListener('click', () => this.startVoiceInput());
            
            // Menu button
            this.widget.querySelector('.medcor-lightbulb-button').addEventListener('click', () => this.toggleMenu());
        }
        
        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }
        
        open() {
            this.isOpen = true;
            this.widget.style.display = 'flex';
            this.toggleButton.style.display = 'none';
            this.scrollToBottom();
        }
        
        close() {
            this.isOpen = false;
            this.widget.style.display = 'none';
            this.toggleButton.style.display = 'flex';
        }
        
        async sendMessage() {
            const input = this.widget.querySelector('.medcor-input-field');
            const text = input.value.trim();
            
            if (!text || this.isLoading) return;
            
            // Add user message
            this.addMessage(text, 'user');
            input.value = '';
            
            // Show typing indicator
            this.showTyping();
            
            try {
                // Get response from AI
                const response = await this.generateResponse(text);
                this.addMessage(response, 'bot');
            } catch (error) {
                console.error('Send message error:', error);
                this.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
            } finally {
                this.hideTyping();
            }
        }
        
        addMessage(text, sender) {
            const message = {
                id: Date.now(),
                text: text,
                sender: sender,
                timestamp: new Date()
            };
            
            this.messages.push(message);
            this.renderMessages();
            this.scrollToBottom();
        }
        
        renderMessages() {
            const container = this.widget.querySelector('.medcor-chat-messages');
            container.innerHTML = '';
            
            this.messages.forEach(message => {
                const messageEl = document.createElement('div');
                messageEl.className = `medcor-message ${message.sender}`;
                messageEl.textContent = message.text;
                container.appendChild(messageEl);
            });
        }
        
        showTyping() {
            this.isLoading = true;
            const container = this.widget.querySelector('.medcor-chat-messages');
            
            const typingEl = document.createElement('div');
            typingEl.className = 'medcor-typing-indicator';
            typingEl.innerHTML = `
                <span class="medcor-typing-text">Yazıyor</span>
                <div class="medcor-typing-dots">
                    <div class="medcor-typing-dot"></div>
                    <div class="medcor-typing-dot"></div>
                    <div class="medcor-typing-dot"></div>
                </div>
            `;
            
            container.appendChild(typingEl);
            this.scrollToBottom();
        }
        
        hideTyping() {
            this.isLoading = false;
            const typing = this.widget.querySelector('.medcor-typing-indicator');
            if (typing) {
                typing.remove();
            }
        }
        
        scrollToBottom() {
            const container = this.widget.querySelector('.medcor-chat-messages');
            container.scrollTop = container.scrollHeight;
        }
        
        async generateResponse(input) {
            try {
                // Real API call to backend
                const response = await fetch('/api/chat-widget/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: input,
                        sessionId: this.sessionId || 'widget_' + Date.now(),
                        language: this.config.language
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    this.sessionId = data.sessionId;
                    return data.response;
                } else {
                    throw new Error(data.error || 'API Error');
                }
            } catch (error) {
                console.error('API Error:', error);
                
                // Fallback responses
                const text = input.toLowerCase();
                
                if (text.includes('randevu') || text.includes('appointment')) {
                    return 'Randevu almak için hangi bölümden bir doktor ile görüşmek istiyorsunuz? Kardiyoloji, Dahiliye, Çocuk Sağlığı veya Dermatoloji bölümlerinde uzman doktorlarımız bulunmaktadır.';
                }
                
                if (text.includes('doktor') || text.includes('doctor')) {
                    return 'Kliniğimizde deneyimli doktorlarımız var:\n\n👨‍⚕️ Dr. Sarah Johnson - Kardiyoloji\n👨‍⚕️ Dr. Michael Chen - Dahiliye\n👩‍⚕️ Dr. Emily Rodriguez - Çocuk Sağlığı\n👨‍⚕️ Dr. David Thompson - Dermatoloji\n\nHangi doktor hakkında bilgi almak istiyorsunuz?';
                }
                
                if (text.includes('saat') || text.includes('time') || text.includes('açık')) {
                    return 'Kliniğimiz çalışma saatleri:\n\n🕐 Pazartesi-Cuma: 08:00-18:00\n🕐 Cumartesi: 09:00-15:00\n🔴 Pazar: Kapalı\n\n🚨 Acil durumlar için 7/24 hizmet veriyoruz.';
                }
                
                if (text.includes('fiyat') || text.includes('ücret') || text.includes('price')) {
                    return 'Muayene ücretlerimiz sigorta kapsamına göre değişmektedir. Detaylı bilgi için:\n\n📞 0212 XXX XXXX\n📧 info@medcor.com\n\nRandevu sırasında ücret bilgileri paylaşılacaktır.';
                }
                
                if (text.includes('nerede') || text.includes('adres') || text.includes('location')) {
                    return 'Kliniğimizin konumu:\n\n📍 Building 64, Dubai Healthcare City\n📍 Dubai, UAE\n\n🚇 Metro ile kolayca ulaşabilirsiniz\n🅿️ Ücretsiz park alanı mevcuttur';
                }
                
                if (text.includes('teşekkür') || text.includes('thank')) {
                    return 'Rica ederim! Başka sorularınız varsa yardımcı olmaktan mutluluk duyarım. 😊';
                }
                
                return 'Anlayamadım, lütfen daha detaylı bilgi verebilir misiniz? Size şu konularda yardımcı olabilirim:\n\n• 📅 Randevu alma\n• 👨‍⚕️ Doktor bilgileri\n• 🕐 Çalışma saatleri\n• 📍 Konum bilgileri';
            }
        }
        
        startVoiceInput() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Ses tanıma bu tarayıcıda desteklenmiyor.');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = this.config.language === 'tr' ? 'tr-TR' : 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            const micButton = this.widget.querySelector('.medcor-mic-button');

            recognition.onstart = () => {
                this.isRecording = true;
                micButton.classList.add('recording');
            };

            recognition.onend = () => {
                this.isRecording = false;
                micButton.classList.remove('recording');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const input = this.widget.querySelector('.medcor-input-field');
                input.value = transcript;
                this.isRecording = false;
                micButton.classList.remove('recording');
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                micButton.classList.remove('recording');
            };

            recognition.start();
        }
        
        toggleMenu() {
            // Menu functionality can be expanded
            console.log('Menu toggled');
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MedcorChat = new MedcorChatWidget();
        });
    } else {
        window.MedcorChat = new MedcorChatWidget();
    }

    // Export for manual initialization
    window.MedcorChatWidget = MedcorChatWidget;
})();