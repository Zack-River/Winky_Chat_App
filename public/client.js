// ✅ USERNAME SETUP
let username = localStorage.getItem("winky_username");
if (!username) {
  username = prompt("🎉 Welcome to Winky!\nChoose a fun username:") || `User${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem("winky_username", username);
}

// ✅ SOCKET.IO
const socket = io();

// ✅ DOM REFERENCES
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const users = document.getElementById("users");
const userList = document.getElementById("user-list");
const emojiBtn = document.getElementById("emojiBtn");
const emojiModal = document.getElementById("emojiModal");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const startCallBtn = document.getElementById("startCallBtn");
const videoArea = document.getElementById("videoArea");
const localVideo = document.getElementById("localVideo");

// ✅ JOIN CHAT ROOM
socket.on("connect", () => {
  socket.emit("join", username);
});

// ✅ SEND CHAT MESSAGE
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg.length > 0) {
    const payload = { text: msg, time: Date.now() };
    socket.emit("message", payload);
    playSound('send');
    input.value = "";
  }
});

// ✅ ENTER TO SEND
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// ✅ INCOMING CHAT
socket.on("message", addMessage);
socket.on("system", addSystemMessage);
socket.on("online-users", updateOnlineUsers);

// ✅ ADD MESSAGE
function addMessage({ from, time, text }) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", from === username ? "you" : "reply");
  const d = new Date(time);
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  messageEl.innerHTML = `
    <div style="font-size: 0.75rem; opacity:0.7;">${from} • ${timeStr}</div>
    <div>${escapeHtml(text)}</div>
  `;

  messages.appendChild(messageEl);
  removeWelcome();
  playSound('receive');
  messageEl.scrollIntoView({ behavior: "smooth", block: "end" });
}

// ✅ SYSTEM MESSAGE
function addSystemMessage(msg) {
  removeWelcome();
  const messageEl = document.createElement("div");
  messageEl.className = "system message";
  messageEl.textContent = msg;
  messages.appendChild(messageEl);
  messageEl.scrollIntoView({ behavior: "smooth", block: "end" });
  const lower = msg.toLowerCase();
  if (lower.includes("joined")) playSound("join");
  if (lower.includes("left")) playSound("leave");
}

function removeWelcome() {
  const welcome = document.querySelector(".welcome-message");
  if (welcome) welcome.remove();
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

// ✅ THEME TOGGLE
themeToggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-mode");
  themeToggleBtn.textContent = isLight ? "🌞" : "🌙";
  localStorage.setItem("winky-theme", isLight ? "light" : "dark");
});

if (localStorage.getItem("winky-theme") === "light") {
  document.body.classList.add("light-mode");
  themeToggleBtn.textContent = "🌞";
}

// ✅ EMOJI PICKER
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
document.addEventListener("click", (e) => {
  if (!emojiModal.contains(e.target) && !emojiBtn.contains(e.target)) emojiModal.classList.add("hidden");
});

// ✅ CLEAR CHAT
clearChatBtn.addEventListener("click", () => {
  messages.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-icon">🎉</div>
      <p>Welcome to Winky! Start chatting instantly</p>
    </div>
  `;
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
  fuck: "🖕🏿",
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
      const regex = new RegExp(`(:*${key}:*)`, "gi");
      data.text = data.text.replace(regex, emoji);
    });
  }
  return originalEmit.call(this, event, data);
};

// ✅ PLAY SOUND
function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    let freqStart = 800, freqEnd = 800;
    switch (type) {
      case "send": freqStart = 700; freqEnd = 900; break;
      case "receive": freqStart = 500; freqEnd = 400; break;
      case "join": freqStart = 600; freqEnd = 750; break;
      case "leave": freqStart = 500; freqEnd = 350; break;
    }
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freqStart, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(freqEnd, audioContext.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {}
}

// =======================================
// ✅ ✅ VIDEO CALL: MULTI-PEER with Username Labels
// =======================================

let localStream;
const peers = {};
let myPeerId = null;
const peerNames = {}; // 👈 stores peerId -> username

startCallBtn.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: true
    });
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    socket.emit("join-video", { username }); // 👈 Send name too!
    startCallBtn.disabled = true;
  } catch (err) {
    console.error(err);
    alert("Could not access camera/mic");
  }
};

socket.on("init-peer-id", ({ peerId }) => {
  myPeerId = peerId;
  peerNames[peerId] = username; // 👈 Save your own
});

socket.on("new-peer", async ({ peerId, username: peerUsername }) => {
  if (peerId === myPeerId) return;

  console.log("New peer:", peerId, peerUsername);
  peerNames[peerId] = peerUsername; // 👈 Save name

  const pc = createPeerConnection(peerId);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("video-offer", { peerId, offer });
});

socket.on("video-offer", async ({ peerId, offer, username: peerUsername }) => {
  peerNames[peerId] = peerUsername; // 👈 Save name
  const pc = createPeerConnection(peerId);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("video-answer", { peerId, answer });
});

socket.on("video-answer", async ({ peerId, answer }) => {
  const pc = peers[peerId];
  if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", ({ peerId, candidate }) => {
  const pc = peers[peerId];
  if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("remove-peer", ({ peerId }) => {
  if (peers[peerId]) {
    peers[peerId].close();
    delete peers[peerId];
  }
  const box = document.getElementById(`peer-${peerId}`);
  if (box) box.remove();
  delete peerNames[peerId]; // ✅ Clean up name too
});

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("ice-candidate", { peerId, candidate: e.candidate });
  };

  pc.ontrack = e => {
    console.log("Track for", peerId);

    let box = document.getElementById(`peer-${peerId}`);
    if (!box) {
      box = document.createElement("div");
      box.className = "video-box";
      box.id = `peer-${peerId}`;

      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;

      const muteBtn = document.createElement("button");
      muteBtn.textContent = "Mute";
      muteBtn.onclick = () => {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? "Unmute" : "Mute";
      };

      box.appendChild(video);
      box.appendChild(muteBtn);

      const label = document.createElement("div");
      label.className = "video-label";
      label.textContent = peerNames[peerId] || peerId; // ✅ Show username!
      box.appendChild(label);

      videoArea.appendChild(box);
    }

    const remoteVideo = box.querySelector("video");
    remoteVideo.srcObject = e.streams[0];
  };

  peers[peerId] = pc;
  return pc;
}