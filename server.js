import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory store to simulate session tracking
const sessions = new Map();

// Richer decision matrix logic
const decisionMatrix = {
    initialPrompts: [
        "Can you tell me a story from one of your favorite holidays?",
        "What’s one song that brings back special memories?",
        "Did you have a favorite winter activity as a child?",
        "What family tradition do you remember the most?",
        "Can you describe a meal that always made you feel happy?"
    ],

    analyzeInput: (text) => {
        const lower = text.toLowerCase();

        const signals = {
            emotional: {
                positive: /(love|happy|joy|warm|special|wonderful|favorite|laugh|smile)/.test(lower),
                negative: /(sad|miss|lonely|tough|hard|regret|upset|angry|difficult)/.test(lower),
                hesitant: /(don’t know|not sure|can't remember|maybe|i guess)/.test(lower),
            },
            cognitive: {
                confused: /(confused|dementia|forget|can't think|foggy|unclear)/.test(lower),
                short: text.length < 20,
                structured: text.length > 40 && /[.?!]/.test(text),
            }
        };

        return signals;
    },

    getResponse: (signals) => {
        const { emotional, cognitive } = signals;

        // Emotional Redirection
        if (emotional.negative) {
            return "I understand that might be hard to talk about. Can I ask—how did you celebrate the holidays as a child?";
        }

        if (emotional.positive) {
            return "That sounds lovely. What made that moment stand out for you?";
        }

        if (emotional.hesitant || cognitive.confused) {
            return "That’s okay—sometimes memories take a moment. What kinds of sounds or smells do you associate with that time?";
        }

        // Cognitive Branching
        if (cognitive.short) {
            return "Could you describe a little more about how that made you feel?";
        }

        if (cognitive.structured) {
            return "That was such a clear memory—what do you think you learned from that experience?";
        }

        return "That's interesting. What else do you remember from that time?";
    }
};

// Fetch available models for dropdown
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        const models = ["AreciboAI", ...data.models.map(model => model.name)];
        res.json({ models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Error fetching models' });
    }
});

// Chat API
app.post('/api/chat', async (req, res) => {
    const { model, message, sessionId, isInitial } = req.body;

    try {
        let responseText = "";

        if (model === "AreciboAI") {
            // Initialize session state if needed
            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, {
                    history: [],
                    lastPrompt: null
                });
            }

            const session = sessions.get(sessionId);

            if (isInitial) {
                const initial = decisionMatrix.initialPrompts[
                    Math.floor(Math.random() * decisionMatrix.initialPrompts.length)
                ];
                session.lastPrompt = initial;
                session.history.push({ role: "AI", text: initial });
                responseText = initial;
            } else {
                // Analyze and respond based on the decision matrix
                const signals = decisionMatrix.analyzeInput(message);
                const response = decisionMatrix.getResponse(signals);
                session.history.push({ role: "User", text: message });
                session.history.push({ role: "AI", text: response });
                responseText = response;
            }
        } else {
            responseText = `Response from ${model}: "${message}" (Simulated)`;
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'AI error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`✅ Ensure Ollama is running at http://localhost:11434`);
});
