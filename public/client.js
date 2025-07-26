// ✅ Username
let username = localStorage.getItem("winky_username");
if (!username) {
  username = prompt("🎉 Welcome to Winky!\nChoose a fun username:") || `User${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem("winky_username", username);
}

const socket = io();

// ✅ DOM
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const users = document.getElementById("users");
const userList = document.getElementById("user-list");
const sendButton = document.getElementById("sendButton");
const emojiBtn = document.getElementById("emojiBtn");
const emojiModal = document.getElementById("emojiModal");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

// ✅ Join
socket.on("connect", () => {
  socket.emit("join", username);
});

// ✅ Send
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg.length > 0) {
    const payload = { text: msg, time: Date.now() };
    socket.emit("message", payload);
    playSound('send')
    input.value = "";
  }
});

// ✅ Enter to send
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

// ✅ Incoming
socket.on("message", addMessage);
socket.on("system", addSystemMessage);
socket.on("online-users", updateOnlineUsers);

function removeWelcome() {
  const welcome = document.querySelector(".welcome-message");
  if (welcome) welcome.remove();
}

function addMessage({ from, time, text }) {
  removeWelcome(); // ✅ Remove welcome message
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", from === username ? "you" : "reply");
  const d = new Date(time);
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  messageEl.innerHTML = `<div style="font-size: 0.75rem; opacity:0.7;">${from} • ${timeStr}</div><div>${escapeHtml(text)}</div>`;
  messages.appendChild(messageEl);

  messageEl.scrollIntoView({ behavior: "smooth", block: "end" }); // ✅ Always scroll last
  playSound(from === username ? "send" : "receive");
}

function addSystemMessage(msg) {
  removeWelcome(); // ✅ Also remove welcome if system message is shown
  const messageEl = document.createElement("div");
  messageEl.className = "system message";
  messageEl.textContent = msg;
  messages.appendChild(messageEl);

  messageEl.scrollIntoView({ behavior: "smooth", block: "end" }); // ✅
  const lower = msg.toLowerCase();
  if (lower.includes("joined")) playSound("join");
  if (lower.includes("left")) playSound("leave");
}

function addSystemMessage(msg) {
  const messageEl = document.createElement("div");
  messageEl.className = "system message";
  messageEl.textContent = msg;
  messages.appendChild(messageEl);
  messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });

  const lower = msg.toLowerCase();
  if (lower.includes("joined")) playSound("join");
  if (lower.includes("left")) playSound("leave");
}

function updateOnlineUsers(list) {
  users.textContent = list.length;
  userList.innerHTML = list.map(name => `<span>${escapeHtml(name)}</span>`).join(", ");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ✅ Theme toggle
themeToggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-mode");
  localStorage.setItem("winky-theme", isLight ? "light" : "dark");
});

if (localStorage.getItem("winky-theme") === "light") {
  document.body.classList.add("light-mode");
  themeToggleBtn.textContent = "🌞";
}

// ✅ Emoji
emojiBtn.addEventListener("click", () => {
  emojiModal.classList.toggle("hidden");
});
document.querySelectorAll(".emoji-item").forEach(el => {
  el.addEventListener("click", () => {
    input.value += el.textContent;
    emojiModal.classList.add("hidden");
    input.focus();
  });
});

// ✅ Click outside to close
document.addEventListener("click", (e) => {
  if (!emojiModal.contains(e.target) && !emojiBtn.contains(e.target)) emojiModal.classList.add("hidden");
});

// ✅ Easter eggs
const easterEggs = {
  wink: "😉",
  party: "🎉",
  love: "❤️",
  fire: "🔥",
  cool: "😎",
  lol: "😂",
  lmao: "🤣",
  rofl: "🤣",
  haha: "😆",
  cry: "😭",
  sad: "😢",
  hug: "🤗",
  ok: "👌",
  clap: "👏",
  yes: "✅",
  no: "❌",
  wow: "😮",
  shock: "😲",
  kiss: "😘",
  heart: "💖",
  star: "⭐",
  boom: "💥",
  100: "💯",
  up: "👍",
  down: "👎",
  fist: "✊",
  peace: "✌️",
  pray: "🙏",
  skull: "💀",
  ghost: "👻",
  alien: "👽",
  poop: "💩",
  fuck: "🖕",
  shit: "💩",
  devil: "😈",
  angel: "😇",
  king: "👑",
  queen: "👑",
  crown: "👑",
  sun: "☀️",
  moon: "🌙",
  sparkle: "✨",
  rain: "🌧️",
  snow: "❄️",
  coffee: "☕",
  pizza: "🍕",
  cake: "🍰",
  beer: "🍻",
  drink: "🥤",
  gift: "🎁",
  ball: "⚽",
  game: "🎮",
  music: "🎵",
  phone: "📱",
  laptop: "💻",
  money: "💸",
  bomb: "💣",
  time: "⏰",
  sleep: "😴",
  rip: "🪦",
  bro: "🤝",
  flex: "💪",
  eyes: "👀",
  partytime: "🥳"
};



const originalEmit = socket.emit;

socket.emit = function (event, data) {
  if (event === "message" && typeof data === "object" && data.text) {
    Object.entries(easterEggs).forEach(([key, emoji]) => {
      const regex = new RegExp(`([/:*])${key}([/:*])`, "gi");
      data.text = data.text.replace(regex, emoji);
    });
  }
  return originalEmit.call(this, event, data);
};

clearChatBtn.addEventListener("click", () => {
  // Clear all messages
  messages.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-icon">🎉</div>
      <p>Welcome to Winky! Start chatting instantly</p>
    </div>
  `;
});

function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let freqStart = 800;
    let freqEnd = 800;

    switch (type) {
      case "send":
        freqStart = 700;  // a soft click up
        freqEnd = 900;
        break;
      case "receive":
        freqStart = 500;  // a soft pop down
        freqEnd = 400;
        break;
      case "join":
        freqStart = 600;  // chime up
        freqEnd = 750;
        break;
      case "leave":
        freqStart = 500;  // fade down
        freqEnd = 350;
        break;
      default:
        freqStart = 500;
        freqEnd = 500;
    }

    oscillator.type = "sine";  // softer than 'square' or 'sawtooth'
    oscillator.frequency.setValueAtTime(freqStart, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(freqEnd, audioContext.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    // No sound fallback
  }
}