import { useState, useRef, useEffect } from "react";
import { askAiAgent } from "../api/dataService";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      content: "שלום! אני הבוט של עומר. איך אפשר לעזור לך היום?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);

  // Continuously watch user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    let watchId = null;

    // Watch position continuously
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation(`${latitude},${longitude}`);
        console.log(`📍 User location updated: ${latitude}, ${longitude}`);
      },
      (error) => {
        // Just log the error, don't block - continue without location
        console.warn("Location unavailable:", error.message);
      },
      { 
        enableHighAccuracy: false, // Low accuracy is faster and more reliable
        timeout: 60000, // 1 minute timeout
        maximumAge: 60000 // Accept cached location up to 1 min old
      }
    );

    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Format chat history for context_window
  const formatContextWindow = (messagesList) => {
    return messagesList
      .map((msg) => {
        const role = msg.role === "user" ? "משתמש" : "עוזר";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  };

  // Handle sending a message
  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    };
    
    // Build updated messages list BEFORE state update
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build context window with ALL messages including the new one
      const contextWindow = formatContextWindow(updatedMessages);
      
      // DEBUG: Log what we're sending
      console.log("=== SENDING TO AI AGENT ===");
      console.log("Query:", trimmedInput);
      console.log("Context Window:", contextWindow);
      console.log("User Location:", userLocation || "Not available (using Omer center)");
      console.log("===========================");
      
      // Call AI Agent with location
      const response = await askAiAgent(trimmedInput, contextWindow, userLocation || "");

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        role: "bot",
        content: response.final_answer || "לא קיבלתי תשובה מהשרת",
        toolResults: response.tool_results,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: "bot",
        content: `שגיאה: ${error.message}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* --- בועת צ'אט --- */}
      <div className="chat-bubble" onClick={() => setIsOpen((v) => !v)}>
        {isOpen ? "✕" : "💬"}
      </div>

      {/* --- חלון צ'אט --- */}
      <div className={`chat-window ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          <span>
            🤖 עוזר אישי - עומר
            {userLocation && (
              <span title="מיקום זמין" style={{ marginRight: "2px", fontSize: "12px" }}>
                📍מודע למיקומך
              </span>
            )}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
            aria-label="סגירת צ'אט"
          >
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: msg.role === "user" ? "#dcf8c6" : msg.isError ? "#ffebee" : "#e1f5fe",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                marginBottom: "10px",
                maxWidth: "85%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                marginLeft: msg.role === "user" ? "auto" : "0",
                marginRight: msg.role === "user" ? "0" : "auto",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              {msg.content}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div
              style={{
                background: "#e1f5fe",
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                marginBottom: "10px",
                maxWidth: "85%",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span className="typing-dot" style={{ animationDelay: "0s" }}>●</span>
              <span className="typing-dot" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="typing-dot" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div
          className="chat-input-area"
          style={{ display: "flex", padding: "10px", borderTop: "1px solid #eee", gap: "8px" }}
        >
          <input
            type="text"
            placeholder="הקלד הודעה..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            style={{
              flex: 1,
              borderRadius: "20px",
              padding: "10px 16px",
              border: "1px solid #ddd",
              outline: "none",
              fontSize: "14px",
              direction: "rtl",
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            style={{
              border: "none",
              background: isLoading || !inputValue.trim() ? "#ccc" : "#4CAF50",
              color: "white",
              fontSize: "18px",
              padding: "8px 14px",
              borderRadius: "50%",
              cursor: isLoading || !inputValue.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="שליחה"
          >
            {isLoading ? "⏳" : "➤"}
          </button>
        </div>
      </div>

      {/* --- CSS for typing animation --- */}
      <style>{`
        .typing-dot {
          color: #666;
          animation: typingBounce 1s infinite;
          display: inline-block;
        }
        
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        
        .chat-messages {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </>
  );
}
