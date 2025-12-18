// Inject chat UI into every page
const mount = document.getElementById("chatMount");

mount.innerHTML = `
  <div class="chat-fab" id="chatFab">💬</div>

  <div class="chat-panel" id="chatPanel">
    <div class="chat-header">
      <div><strong>Research Rankings Assistant</strong></div>
      <button class="chat-close" id="chatClose">✕</button>
    </div>

    <div class="chat-messages" id="chatMessages"></div>

    <div class="chat-input">
      <input
        id="chatText"
        type="text"
        placeholder="Ask about rankings, filters, methodology…"
      />
      <button id="chatSend">Send</button>
    </div>
  </div>
`;

// Load chat behavior AFTER UI exists
const script = document.createElement("script");
script.src = "chat.js";
document.body.appendChild(script);
