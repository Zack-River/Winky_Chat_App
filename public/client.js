// ✅ 1️⃣ Get username from localStorage
let username = localStorage.getItem('winky_username');

if (!username) {
  username = prompt('Enter your name:') || 'Anonymous';
  localStorage.setItem('winky_username', username);
}

const socket = io(); // automatically uses the same origin

socket.on('connect', () => {
  socket.emit('join', username);
});

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const users = document.getElementById('users');

// ✅ 2️⃣ Prevent default reload on submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('message', input.value.trim());
    input.value = '';
  }
});

socket.on('message', (data) => {
  const item = document.createElement('div');
  item.classList.add('message');

  if (data.from === username) {
    item.classList.add('you');
  } else {
    item.classList.add('reply');
  }

  item.textContent = `[${data.time}] ${data.from}: ${data.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('system', (msg) => {
  const item = document.createElement('div');
  item.classList.add('system');
  item.textContent = msg;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('online-users', (list) => {
  users.textContent = list.join(', ');
});