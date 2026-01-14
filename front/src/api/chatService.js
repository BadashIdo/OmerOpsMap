/**
 * Chat Service API
 * 
 * Handles communication with the AI Agent backend (Port 8000)
 * 
 * Integration Points:
 * - POST /chat - Send message and receive response
 * - WebSocket /ws/chat - Real-time chat stream (optional)
 * 
 * TODO: Update BASE_URL when AI Agent is deployed
 */

const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || 'http://localhost:8000';

/**
 * Send a message to the AI Agent
 * @param {string} message - User message
 * @param {string} sessionId - Session identifier (optional)
 * @returns {Promise<Object>} AI response
 */
export async function sendChatMessage(query, contextWindow = '', selfLocation = null) {
  try {
    const response = await fetch(`${AI_AGENT_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        context_window: contextWindow,
        self_location: selfLocation
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      response: data.final_answer || data.message,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      error: error.message,
      response: 'מצטער, שירות הצ\'אט אינו זמין כרגע.',
    };
  }
}

/**
 * Check AI Agent health status
 * @returns {Promise<boolean>} true if service is available
 */
export async function checkAIAgentHealth() {
  try {
    const response = await fetch(`${AI_AGENT_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('AI Agent health check failed:', error);
    return false;
  }
}

/**
 * Generate a unique session ID for the user
 * @returns {string} Session ID
 */
function generateSessionId() {
  const existing = sessionStorage.getItem('ai_chat_session_id');
  if (existing) return existing;

  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('ai_chat_session_id', newId);
  return newId;
}

/**
 * WebSocket connection for real-time chat (optional future enhancement)
 * @param {Function} onMessage - Callback for incoming messages
 * @returns {WebSocket} WebSocket instance
 */
export function connectChatWebSocket(onMessage) {
  const wsUrl = AI_AGENT_URL.replace('http', 'ws');
  const sessionId = generateSessionId();
  const ws = new WebSocket(`${wsUrl}/ws/chat?session_id=${sessionId}`);

  ws.onopen = () => {
    console.log('Chat WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('Chat WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Chat WebSocket disconnected');
  };

  return ws;
}
