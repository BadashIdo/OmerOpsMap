const API_URL = "http://localhost:8000/ask";

const queryEl = document.getElementById("query");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const answerEl = document.getElementById("answer");
const copyBtn = document.getElementById("copyBtn");

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  statusEl.textContent = isLoading ? "שולח..." : "";
}

async function sendQuery() {
  const query = queryEl.value.trim();
  if (!query) return;

  setLoading(true);
  answerEl.textContent = "…";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        query,
        context_window: "",
        self_location: "31.26,34.80",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.detail ? String(data.detail) : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    answerEl.textContent = data.final_answer ?? "(no final_answer returned)";
  } catch (e) {
    answerEl.textContent = `Error: ${e?.message ?? String(e)}`;
  } finally {
    setLoading(false);
  }
}

queryEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendQuery();
  }
});

sendBtn.addEventListener("click", sendQuery);

copyBtn.addEventListener("click", async () => {
  const text = answerEl.textContent || "";
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = "הועתק ✅";
    setTimeout(() => (statusEl.textContent = ""), 1200);
  } catch {
    statusEl.textContent = "לא הצלחתי להעתיק";
    setTimeout(() => (statusEl.textContent = ""), 1200);
  }
});

queryEl.focus();
