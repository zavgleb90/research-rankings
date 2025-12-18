const WORKER_URL = "https://lingering-cloud-a9b2.zavgleb.workers.dev";

let chatOpen = false;
let chatHistory = [];

document.addEventListener("click", (e) => {
  if (e.target.id === "chatFab") toggleChat(true);
  if (e.target.id === "chatClose") toggleChat(false);
  if (e.target.id === "chatSend") sendChat();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement.id === "chatText") {
    sendChat();
  }
});

function toggleChat(open) {
  chatOpen = open;
  document.getElementById("chatPanel").style.display = open ? "flex" : "none";
}

function addMessage(text, who) {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `chat-msg ${who}`;
  div.innerText = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById("chatText");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMessage(text, "user");

  chatHistory.push({ role: "user", text });

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(-10) // keep last 10 turns
      })
    });

    const data = await res.json();
    const reply = data.reply || "No response.";

    addMessage(reply, "bot");
    chatHistory.push({ role: "model", text: reply });

  } catch (err) {
    addMessage("Error contacting AI service.", "bot");
  }
}
