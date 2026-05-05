import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api/chatService';
import styles from '../styles/ChatBot.module.css';

const CHAT_STORAGE_KEY = 'chat_messages';

const WELCOME_MESSAGE = {
  id: 1,
  text: 'שלום! אני עוזר AI של מערכת OmerOpsMap. במה אוכל לעזור לך היום?',
  sender: 'bot',
  timestamp: new Date(),
};

function loadMessages() {
  try {
    const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(stored);
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [WELCOME_MESSAGE];
  }
}

const ChatBot = ({ isOpen, setIsOpen, onSiteClick, allSites = [] }) => {
  const [messages, setMessages] = useState(loadMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, typingText]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 50);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const typewriterEffect = (fullText, onDone) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;
    const speed = Math.max(7, Math.min(18, 1800 / fullText.length));
    typingRef.current = setInterval(() => {
      i++;
      setTypingText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(typingRef.current);
        setIsTyping(false);
        setTypingText('');
        onDone();
      }
    }, speed);
  };

  const buildContextWindow = (currentMessages) => {
    return currentMessages
      .slice(-4)
      .map(msg => {
        const role = msg.sender === 'user' ? '[User]' : '[AI]';
        return `${role}: ${msg.text}`;
      })
      .join('\n');
  };

  const getUserLocation = () => {
    const isTracking = sessionStorage.getItem('location_tracking') === 'true';
    if (!isTracking) return null;
    return sessionStorage.getItem('user_location') || null;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const userMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    const contextWindow = buildContextWindow(messages);
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const location = getUserLocation();
      const result = await sendChatMessage(userText, contextWindow, location);

      if (result.success) {
        const fullText = result.response;
        const botMessage = {
          id: Date.now() + 1,
          text: fullText,
          sender: 'bot',
          timestamp: new Date(),
        };
        typewriterEffect(fullText, () => setMessages((prev) => [...prev, botMessage]));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending message to AI Agent:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "מצטער, נראה ששירות הצ'ט אינו זמין כרגע. 🔌",
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

  const renderBotText = (text) => {
    if (!onSiteClick || !allSites?.length) {
      return (
        <div className={styles.botTextBlock}>
          {text.split('\n').map((l, i) => <p key={i}>{l || ' '}</p>)}
        </div>
      );
    }

    // Sort longest names first to avoid partial matches
    const sortedSites = [...allSites].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

    const highlightLine = (line) => {
      let remaining = line;
      const parts = [];
      let key = 0;
      while (remaining.length > 0) {
        let matched = false;
        for (const site of sortedSites) {
          if (!site.name) continue;
          const idx = remaining.indexOf(site.name);
          if (idx !== -1) {
            if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
            parts.push(
              <button
                key={key++}
                className={styles.siteLink}
                onClick={() => { onSiteClick(site); setIsOpen(false); }}
              >
                {site.name}
              </button>
            );
            remaining = remaining.slice(idx + site.name.length);
            matched = true;
            break;
          }
        }
        if (!matched) {
          parts.push(<span key={key++}>{remaining}</span>);
          break;
        }
      }
      return parts;
    };

    return (
      <div className={styles.botTextBlock}>
        {text.split('\n').map((line, i) => (
          <p key={i}>{line ? highlightLine(line) : ' '}</p>
        ))}
      </div>
    );
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <button
        className={`${styles.chatToggle} ${isOpen ? styles.chatToggleActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "סגור צ'אט" : "פתח צ'אט AI"}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <span className={styles.headerIcon}>🤖</span>
              <div className={styles.headerText}>
                <h3>AI Assistant</h3>
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

          <div className={styles.messagesContainer}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
              >
                <div className={styles.messageContent}>
                  {msg.sender === 'bot' ? renderBotText(msg.text) : <p>{msg.text}</p>}
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
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            {isTyping && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.messageContent}>
                  {renderBotText(typingText)}
                  <span className={styles.cursor}>|</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
