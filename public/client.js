////////////////////////////////////////////////
// ✅ USERNAME SETUP
////////////////////////////////////////////////
let username = localStorage.getItem("winky_username");
if (!username) {
  username = prompt("🎉 Welcome to Winky!\nChoose a fun username:") || `User${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem("winky_username", username);
}

////////////////////////////////////////////////
// ✅ SOCKET.IO
////////////////////////////////////////////////
const socket = io();

////////////////////////////////////////////////
// ✅ DOM REFERENCES
////////////////////////////////////////////////
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
const videoGrid = document.getElementById("video-grid");
const muteBtn = document.getElementById("muteBtn");
const leaveCallBtn = document.getElementById("leaveCallBtn");

////////////////////////////////////////////////
// ✅ GLOBAL AUDIO CONTEXT
////////////////////////////////////////////////
let myAudioCtx = null;
function ensureAudioContext() {
  if (!myAudioCtx) {
    myAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  ensureAudioContext();
  const audioContext = myAudioCtx;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  let freq = 800;
  switch (type) {
    case "send": freq = 700; break;
    case "receive": freq = 500; break;
    case "join": freq = 600; break;
    case "leave": freq = 400; break;
  }

  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  gainNode.gain.value = 0.05;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

////////////////////////////////////////////////
// ✅ JOIN CHAT ROOM
////////////////////////////////////////////////
socket.on("connect", () => {
  socket.emit("join", username);
});

////////////////////////////////////////////////
// ✅ SEND CHAT MESSAGE
////////////////////////////////////////////////
form.addEventListener("submit", (e) => {
  e.preventDefault();
  ensureAudioContext();
  const msg = input.value.trim();
  if (msg.length > 0) {
    socket.emit("message", { text: msg, time: Date.now() });
    playSound("send");
    input.value = "";
  }
});

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

////////////////////////////////////////////////
// ✅ INCOMING CHAT
////////////////////////////////////////////////
socket.on("message", addMessage);
socket.on("system", addSystemMessage);
socket.on("online-users", updateOnlineUsers);

function addMessage({ from, time, text }) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", from === username ? "you" : "reply");
  const d = new Date(time);
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  messageEl.innerHTML = `<div style="font-size: 0.75rem; opacity:0.7;">${from} • ${timeStr}</div><div>${escapeHtml(text)}</div>`;
  messages.appendChild(messageEl);
  removeWelcome();
  playSound("receive");
  messageEl.scrollIntoView({ behavior: "smooth", block: "end" });
}

function addSystemMessage(msg) {
  removeWelcome();
  const messageEl = document.createElement("div");
  messageEl.className = "system message";
  messageEl.textContent = msg;
  messages.appendChild(messageEl);
  messageEl.scrollIntoView({ behavior: "smooth", block: "end" });
  if (msg.toLowerCase().includes("joined")) playSound("join");
  if (msg.toLowerCase().includes("left")) playSound("leave");
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

////////////////////////////////////////////////
// ✅ THEME TOGGLE
////////////////////////////////////////////////
themeToggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-mode");
  themeToggleBtn.textContent = isLight ? "🌞" : "🌙";
  localStorage.setItem("winky-theme", isLight ? "light" : "dark");
});
if (localStorage.getItem("winky-theme") === "light") {
  document.body.classList.add("light-mode");
  themeToggleBtn.textContent = "🌞";
}

////////////////////////////////////////////////
// ✅ EMOJI PICKER
////////////////////////////////////////////////
emojiBtn.addEventListener("click", () => emojiModal.classList.toggle("hidden"));
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

////////////////////////////////////////////////
// ✅ CLEAR CHAT
////////////////////////////////////////////////
clearChatBtn.addEventListener("click", () => {
  messages.innerHTML = `<div class="welcome-message"><div class="welcome-icon">🎉</div><p>Welcome to Winky! Start chatting instantly</p></div>`;
});

////////////////////////////////////////////////
// ✅ VIDEO CALL: MULTI-PEER WITH CLEANUP
////////////////////////////////////////////////
let localStream;
const peers = {};
const peerNames = {};
let myPeerId = null;

startCallBtn.onclick = async () => {
  ensureAudioContext();
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: { width: 640, height: 480 }
    });

    videoArea.style.display = "block";
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    localVideo.play();

    muteBtn.disabled = false;
    leaveCallBtn.disabled = false;
    startCallBtn.disabled = true;

    socket.emit("join-video", { username });

    muteBtn.onclick = () => {
      const audioTrack = localStream?.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        muteBtn.textContent = audioTrack.enabled ? "🔇" : "🎙️";
      }
    };

    leaveCallBtn.onclick = () => stopCall();

  } catch (err) {
    console.error(err);
    alert("Could not access camera/mic");
  }
};

function stopCall() {
  localStream?.getTracks().forEach(track => track.stop());
  localStream = null;
  Object.values(peers).forEach(pc => pc.close());
  for (const id in peers) delete peers[id];
  videoGrid.querySelectorAll(".video-box").forEach(box => box.remove());
  videoArea.style.display = "none";
  muteBtn.disabled = true;
  leaveCallBtn.disabled = true;
  startCallBtn.disabled = false;
  socket.emit("leave-video");
}

socket.on("init-peer-id", ({ peerId }) => {
  myPeerId = peerId;
  peerNames[peerId] = username;
});

socket.on("new-peer", async ({ peerId, username: peerUsername }) => {
  if (peerId === myPeerId) return;
  peerNames[peerId] = peerUsername;
  const pc = createPeerConnection(peerId);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("video-offer", { peerId, offer });
});

socket.on("video-offer", async ({ peerId, offer, username: peerUsername }) => {
  peerNames[peerId] = peerUsername;
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
  peers[peerId]?.close();
  delete peers[peerId];
  delete peerNames[peerId];
  const box = document.getElementById(`peer-${peerId}`);
  if (box) box.remove();
});

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("ice-candidate", { peerId, candidate: e.candidate });
  };

  pc.ontrack = e => {
    let box = document.getElementById(`peer-${peerId}`);
    if (!box) {
      box = document.createElement("div");
      box.className = "video-box";
      box.id = `peer-${peerId}`;

      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;

      const label = document.createElement("div");
      label.className = "video-label";
      label.textContent = peerNames[peerId] || peerId;

      box.appendChild(video);
      box.appendChild(label);
      videoGrid.appendChild(box);
    }
    box.querySelector("video").srcObject = e.streams[0];
  };

  pc.onconnectionstatechange = () => {
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      const box = document.getElementById(`peer-${peerId}`);
      if (box) box.remove();
      delete peers[peerId];
      delete peerNames[peerId];
    }
  };

  peers[peerId] = pc;
  return pc;
}