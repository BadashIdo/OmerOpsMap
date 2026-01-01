import { useState } from "react";

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* --- בועת צ'אט --- */}
      <div className="chat-bubble" onClick={() => setIsOpen((v) => !v)}>
        {isOpen ? "✕" : "💬"}
      </div>

      {/* --- חלון צ'אט --- */}
      <div className={`chat-window ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          <span>עוזר אישי - עומר</span>
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
          <div
            style={{
              background: "#e1f5fe",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "10px",
              textAlign: "right",
            }}
          >
            שלום! אני הבוט של עומר. איך אפשר לעזור לך היום?
          </div>

          <p style={{ color: "#999", textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
            (ממשק הצ'אט יופעל בקרוב...)
          </p>
        </div>

        <div
          className="chat-input-area"
          style={{ display: "flex", padding: "10px", borderTop: "1px solid #eee" }}
        >
          <input
            type="text"
            placeholder="הקלד הודעה..."
            disabled
            style={{
              flex: 1,
              borderRadius: "20px",
              padding: "6px 10px",
              border: "1px solid #ddd",
            }}
          />
          <button
            disabled
            style={{
              border: "none",
              background: "none",
              fontSize: "18px",
              marginRight: "6px",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
            aria-label="שליחה"
          >
            ➡️
          </button>
        </div>
      </div>
    </>
  );
}
