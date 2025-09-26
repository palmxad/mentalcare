const socket = io();
const chatDiv = document.getElementById("chat");
const msgInput = document.getElementById("msgInput");
const messages = document.getElementById("messages");
const status = document.getElementById("status");
const waitingScreen = document.getElementById("waiting-screen");
const sendBtn = document.querySelector(".send-btn");

// Show waiting screen initially
waitingScreen.style.display = "flex";

socket.on("waiting", () => {
  status.innerText = "รอผู้ใช้อีกคน...";
  waitingScreen.style.display = "flex";
});

socket.on("startChat", () => {
  status.innerText = "ออนไลน์"
    ;
  status.style.color = "#4CAF50";
  status.trimLeft = "100px";
  waitingScreen.style.display = "none";
  chatDiv.style.display = "block";

  // Add welcome message
  addSystemMessage("เชื่อมต่อสำเร็จ! เริ่มสนทนาได้เลย");
});

socket.on("message", (msg) => {
  addMessage(msg, "received");
  scrollToBottom();
});

socket.on("end", () => {
  addSystemMessage("อีกฝ่ายออกจากแชทแล้ว");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);
});

function addMessage(text, type, time = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const messageText = document.createElement("div");
  messageText.textContent = text;
  messageDiv.appendChild(messageText);

  if (time) {
    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = time;
    messageDiv.appendChild(timeDiv);
  }

  messages.appendChild(messageDiv);
}

function addSystemMessage(text) {
  const systemDiv = document.createElement("div");
  systemDiv.style.textAlign = "center";
  systemDiv.style.color = "#8e8e8e";
  systemDiv.style.fontSize = "12px";
  systemDiv.style.margin = "16px 0";
  systemDiv.textContent = text;
  messages.appendChild(systemDiv);
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

function sendMsg() {
  const msg = msgInput.value.trim();
  if (msg !== "") {
    const time = new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    addMessage(msg, "sent", time);
    socket.emit("message", msg);
    msgInput.value = "";
    scrollToBottom();
  }
}

// Handle Enter key
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMsg();
  }
});

// Auto-resize input and enable/disable send button
msgInput.addEventListener("input", () => {
  const hasText = msgInput.value.trim().length > 0;
  sendBtn.disabled = !hasText;
  sendBtn.style.background = hasText ? "#3897f0" : "#c0c0c0";
});

// Initialize send button state
sendBtn.disabled = true;
sendBtn.style.background = "#c0c0c0";
