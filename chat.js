const WORKER_URL = "https://lingering-cloud-a9b2.zavgleb.workers.dev/";

const chatFab = document.getElementById("chatFab");
const chatPanel = document.getElementById("chatPanel");
const chatClose = document.getElementById("chatClose");
const chatMessages = document.getElementById("chatMessages");
const chatText = document.getElementById("chatText");
const chatSend = document.getElementById("chatSend");

let history = []; // [{role:"user"|"model", text:"..."}]

function addBubble(text, who) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${who === "user" ? "chat-user" : "chat-model"}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const msg = chatText.value.trim();
  if (!msg) return;

  addBubble(msg, "user");
  history.push({ role: "user", text: msg });
  chatText.value = "";

  addBubble("Thinking…", "model");
  const thinkingBubble = chatMessages.lastChild;

  try {
    const resp = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      thinkingBubble.textContent = data?.error
        ? `Error: ${data.error}`
        : `Error: HTTP ${resp.status}`;
      return;
    }

    if (data?.reply) {
      thinkingBubble.textContent = data.reply;
      history.push({ role: "model", text: data.reply });
    } else {
      thinkingBubble.textContent = "No reply returned by worker.";
    }
  } catch (e) {
    thinkingBubble.textContent = "Error contacting chat service.";
  }
}

chatFab.addEventListener("click", () => {
  chatPanel.style.display = "flex";
});

chatClose.addEventListener("click", () => {
  chatPanel.style.display = "none";
});

chatSend.addEventListener("click", sendMessage);

chatText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
