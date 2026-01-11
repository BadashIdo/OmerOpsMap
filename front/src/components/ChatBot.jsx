import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ChatBot.module.css';

/**
 * ChatBot Component
 * 
 * AI Chat interface that will connect to the AI Agent service (Port 8000)
 * Currently prepared for future integration with back/Ai_agent
 * 
 * Features:
 * - Toggle open/close chat window
 * - Message history display
 * - User input with send button
 * - Auto-scroll to latest message
 * - Responsive design
 * - Ready for WebSocket or REST API integration
 */

const ChatBot = ({ isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'שלום! אני עוזר AI של מערכת OmerOpsMap. במה אוכל לעזור לך היום?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  /**
   * Send message to AI Agent
   * TODO: Replace with actual API call to http://localhost:8000/chat or WebSocket
   */
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // TODO: Replace this mock response with actual AI Agent API call
      // Example:
      // const response = await fetch('http://localhost:8000/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: userMessage.text, session_id: 'user_session' }),
      // });
      // const data = await response.json();
      // const botResponse = data.response;

      // Mock response for now (remove when integrating)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const botResponse = 'תודה על ההודעה! השירות יחובר בקרוב. 🤖';

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message to AI Agent:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'מצטער, נראה ששירות הצ\'ט אינו זמין כרגע. 🔌',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          className={styles.chatToggle}
          onClick={() => setIsOpen(true)}
          title="פתח צ'אט AI"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <span className={styles.headerIcon}>🤖</span>
              <div className={styles.headerText}>
                <h3>AI Assistant</h3>
                <span className={styles.headerStatus}>
                  <span className={styles.statusDot}></span>
                  מחכה לחיבור
                </span>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              title="סגור צ'אט"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.messagesContainer}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage
                }`}
              >
                <div className={styles.messageContent}>
                  <p>{msg.text}</p>
                  <span className={styles.messageTime}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputContainer}>
            <textarea
              ref={inputRef}
              className={styles.input}
              placeholder="הקלד הודעה..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isLoading}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              title="שלח הודעה"
            >
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
