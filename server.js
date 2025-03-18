import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ✅ **Fetch available models for dropdown**
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch('http://localhost:11434/api/tags'); // Fetch models from Ollama
        const data = await response.json();

        // Ensure Ollama AI is always available in the dropdown
        const models = ["Ollama AI", ...data.models.map(model => model.name)];
       
        res.json({ models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Error fetching models' });
    }
});

// ✅ **Chat API to handle messages**
app.post('/api/chat', async (req, res) => {
    const { model, message } = req.body;

    if (!message || !model) {
        return res.status(400).json({ error: 'Model and message are required.' });
    }

    try {
        let responseText;

        // 🟢 If "Ollama AI" is selected, send message to Ollama
        if (model === "Ollama AI") {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mistral', // Change to a different Ollama model if needed
                    prompt: message,
                    stream: false
                }),
            });

            const data = await response.json();
            responseText = data.response || "Ollama AI couldn't generate a response.";
        } else {
            // 🟡 If another model is selected, return a placeholder response
            responseText = `Response from ${model}: "${message}" (Simulated)`;
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Error communicating with AI' });
    }
});

// ✅ **Start server**
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`✅ Ensure Ollama is running at http://localhost:11434`);
});
