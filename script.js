const modelSelect = document.getElementById('modelSelect');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');
const chatContainer = document.getElementById('chatContainer');

let selectedModel = '';
let recognition = null;
let isListening = false;

// Initialize speech recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        micButton.style.display = 'none';
        console.log('Speech recognition not supported');
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('listening');
        messageInput.placeholder = 'Listening...';
        messageInput.value = '';
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('listening');
        messageInput.placeholder = 'Type your message...';

        if (messageInput.value.trim() && selectedModel) {
            sendMessage();
        }
    };

    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        micButton.classList.remove('listening');
    };
}

// Fetch available models
async function fetchModels() {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();

        modelSelect.innerHTML = '';
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });

        modelSelect.value = "Ollama AI";
        selectedModel = "Ollama AI";
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

// Add message to chat
function addMessage(message, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    msgDiv.textContent = message;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message to backend
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !selectedModel) return;

    addMessage(`You: ${message}`, true);
    messageInput.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: selectedModel, message: message }),
        });

        const data = await response.json();
        addMessage(`AI: ${data.response}`);
    } catch (error) {
        addMessage('Error: Failed to send message');
    }
}

fetchModels();
sendButton.addEventListener('click', sendMessage);
initSpeechRecognition();

// Microphone button event listener
micButton.addEventListener('click', () => {
    if (!recognition) return;
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
});
