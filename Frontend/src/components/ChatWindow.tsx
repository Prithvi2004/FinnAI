import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessage } from '../lib/openrouter';

export function ChatWindow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'Hello! I\'m your AI financial assistant. How can I help you today?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const allMessages = [...messages, userMessage];
      const response = await sendMessage(allMessages);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-24 sm:right-8 w-full sm:w-96 h-[100dvh] sm:h-[580px] bg-charcoal-950 border border-charcoal-800/50 sm:rounded-lg shadow-xl flex flex-col overflow-hidden z-[70]">
      <div className="p-4 border-b border-charcoal-800/50 flex items-center justify-between bg-charcoal-900">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-bronze" />
          <span className="font-semibold text-warmGrey-100">Financial Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-warmGrey-400 hover:text-bronze transition-colors"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-charcoal-700 scrollbar-track-charcoal-950" data-lenis-prevent="true">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-bronze text-charcoal-950 ml-4'
                  : 'bg-charcoal-900 text-warmGrey-100 mr-4'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-charcoal-900 text-warmGrey-100 p-3 rounded-lg flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-charcoal-800/50 bg-charcoal-900">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about finance..."
            className="flex-1 bg-charcoal-950 text-warmGrey-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:border-bronze focus:ring-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-bronze text-charcoal-950 p-2 rounded-lg hover:bg-bronze/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}