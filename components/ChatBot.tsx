import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { PartnerData } from '../types';
import { generateConsultantResponse } from '../services/geminiService';

interface Props {
    partnerData: PartnerData;
}

export interface ChatBotHandle {
    simulateInput: (text: string) => Promise<void>;
}

const ChatBot = React.forwardRef<ChatBotHandle, Props>(({ partnerData }, ref) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { role: 'model', text: `Hello ${partnerData.contactName || 'Partner'}! I am your Nimbus Cloud Practice Consultant. based on your scorecard, I see you are in ${partnerData.calculatedTrack}. How can I help you accelerate your AWS practice today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        simulateInput: async (text: string) => {
            setInput('');
            for (let i = 0; i < text.length; i++) {
                setInput(prev => prev + text[i]);
                await new Promise(r => setTimeout(r, 30));
            }
            await new Promise(r => setTimeout(r, 500));
            handleSend(text);
        }
    }));

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (arg?: string | React.SyntheticEvent) => {
        let textToSend = input;
        if (typeof arg === 'string') {
            textToSend = arg;
        }
        
        if (!textToSend.trim()) return;

        const userMsg = textToSend;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        // Convert messages to Gemini history format (User/Model parts)
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        try {
            const response = await generateConsultantResponse(history, partnerData, userMsg);
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
             setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my knowledge base right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="ai-consultant-panel" className="flex flex-col h-[500px] bg-white rounded-xl shadow border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3 rounded-t-xl">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <Sparkles size={16} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Practice Consultant AI</h3>
                    <p className="text-xs text-slate-500">Powered by Gemini</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                {m.text}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                         <div className="flex gap-3 max-w-[80%]">
                             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <Bot size={16} />
                             </div>
                             <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-xs text-slate-500 animate-pulse">
                                 Analyzing partner data...
                             </div>
                         </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                    <input 
                        id="chat-input"
                        type="text"
                        className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Ask about funding, training, or opportunities..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        id="chat-send-btn"
                        onClick={handleSend}
                        disabled={loading}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ChatBot;