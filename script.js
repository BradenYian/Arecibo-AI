const modelSelect = document.getElementById('modelSelect');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');
const chatContainer = document.getElementById('chatContainer');

let selectedModel = '';
let recognition = null;
let isListening = false;
const sessionId = Date.now().toString(); // Simulate a user session
let isInitialInteraction = true;

// ✅ Initialize speech recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        micButton.style.display = 'none';
        console.log('Speech recognition not supported');
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false; // ✅ Final result only
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
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        micButton.classList.remove('listening');
    };
}

// ✅ Fetch available models
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

        modelSelect.value = "AreciboAI";
        selectedModel = "AreciboAI";

        // ✅ Start the AI-led conversation
        await startConversation();
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

// ✅ Add message to chat window
function addMessage(message, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    msgDiv.textContent = message;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ✅ AI initiates conversation with an opening prompt
async function startConversation() {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel,
                message: "",
                isInitial: true,
                sessionId
            }),
        });

        const data = await response.json();
        addMessage(`AreciboAI: ${data.response}`);
    } catch (error) {
        addMessage("Error: Couldn't start the conversation.");
        console.error(error);
    }
}

// ✅ Send message to backend
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !selectedModel) return;

    addMessage(`You: ${message}`, true);
    messageInput.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel,
                message: message,
                isInitial: false,
                sessionId
            }),
        });

        const data = await response.json();
        addMessage(`AreciboAI: ${data.response}`);
        isInitialInteraction = false;
    } catch (error) {
        addMessage('Error: Failed to send message');
        console.error(error);
    }
}

// ✅ Set up UI event listeners
fetchModels();
initSpeechRecognition();
sendButton.addEventListener('click', sendMessage);

micButton.addEventListener('click', () => {
    if (!recognition) return;
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
});

modelSelect.addEventListener('change', (e) => {
    selectedModel = e.target.value;
});
