import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function ChatBot({ isOpen, onClose, initialMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialMessage && isOpen) {
      setInputValue(initialMessage);
    }
  }, [initialMessage, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    try {
      const newConv = await base44.agents.createConversation({
        agent_name: 'omer_bot',
        metadata: { name: 'שיחה חדשה' }
      });
      setConversation(newConv);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: 'שלום! 👋 אני OmerBot, העוזר הדיגיטלי של המועצה המקומית עומר.\n\nאני יכול לעזור לך עם מידע על רחובות, מוסדות, שירותים מוניציפליים והתראות. איך אוכל לעזור?'
      }]);
    } catch (error) {
      console.error('Failed to init conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !conversation) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });

      // Subscribe to updates
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data.messages) {
          setMessages(data.messages);
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage?.role === 'assistant' && !lastMessage.tool_calls?.some(t => t.status === 'running')) {
            setIsLoading(false);
          }
        }
      });

      // Cleanup after response
      setTimeout(() => {
        unsubscribe();
      }, 60000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה. אנא נסה שוב.'
      }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed z-50 transition-all duration-300',
      isMinimized 
        ? 'bottom-4 left-4 w-72'
        : 'bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 max-h-[80vh]'
    )}>
      <div className={cn(
        'bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col',
        isMinimized ? 'h-14' : 'h-[70vh] max-h-[600px]'
      )}>
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">OmerBot</h3>
              <p className="text-xs text-blue-100">העוזר הדיגיטלי של עומר</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                    msg.role === 'user' ? 'bg-blue-100' : 'bg-slate-200'
                  )}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2',
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-slate-200'
                  )}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="הקלד שאלה..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}