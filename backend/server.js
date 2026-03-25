require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Mongoose Schema for Leads
const leadSchema = new mongoose.Schema({
    phoneId: String,
    location: String,
    budget: String,
    propertyType: String,
    status: { type: String, default: 'Qualified' },
    createdAt: { type: Date, default: Date.now }
});
const Lead = mongoose.model('Lead', leadSchema);

// In-memory conversation state (phone -> { history: [] })
const userSessions = new Map();

const systemPrompt = `You are an expert Real Estate Assistant working for 11za Real Estate on WhatsApp.
Your goal is to warmly welcome the user and collect exactly 3 pieces of information to qualify them:
1) Preferred Location
2) Budget
3) Property Type (1BHK/2BHK/Villa/Commercial)

Rules:
- Be extremely polite, short, and conversational.
- Ask ONE question at a time.
- If you already have a piece of information, do NOT ask for it again.
- ONCE you have collected ALL 3 pieces of information, you MUST stop conversing naturally and output ONLY a raw JSON object like this:
{"complete": true, "location": "Andheri", "budget": "25000", "type": "2BHK", "replyMsg": "Thank you! Our agent will contact you shortly with the best properties."}
Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Just the raw JSON string.`;

// 11za Send Message API
async function sendWhatsAppMessage(to, text) {
    try {
        await axios.post('https://api.11za.in/apis/sendMessage/sendMessages', {
            sendto: to,
            authToken: process.env.WHATSAPP_AUTH_TOKEN,
            originWebsite: "https://engees.in",
            contentType: "text",
            text: text
        });
        console.log(`📤 Sent message to ${to}`);
    } catch (error) {
        console.error('❌ Send API Error:', error?.response?.data || error.message);
    }
}

// Webhook endpoint to receive incoming messages
// Make sure 11za sends { from: "...", text: "..." } or adapt based on actual payload
app.post('/webhook', async (req, res) => {
    try {
        console.log('Incoming Webhook:', JSON.stringify(req.body, null, 2));
        
        // Extract sender and message text matching 11za format
        const senderId = req.body.from || req.body.sender || "919904362053"; 
        const incomingText = req.body.UserResponse || (req.body.content && req.body.content.text) || req.body.text || "";

        if (!incomingText) return res.status(200).send('No text found');

        // Get or create session
        if (!userSessions.has(senderId)) {
            userSessions.set(senderId, {
                history: []
            });
        }
        
        const session = userSessions.get(senderId);
        session.history.push({ role: 'user', parts: [{ text: incomingText }] });

        // Call Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: session.history,
            config: { systemInstruction: systemPrompt }
        });

        const replyText = response.text.trim();
        
        // Check if Gemini outputted the final JSON
        if (replyText.startsWith('{') && replyText.endsWith('}')) {
            try {
                const data = JSON.parse(replyText);
                if (data.complete) {
                    // Save to MongoDB
                    const newLead = new Lead({
                        phoneId: senderId,
                        location: data.location,
                        budget: data.budget,
                        propertyType: data.type
                    });
                    await newLead.save();
                    console.log('✅ New Lead Saved to MongoDB:', newLead);

                    // Send final message and clear session
                    await sendWhatsAppMessage(senderId, data.replyMsg);
                    userSessions.delete(senderId);
                    return res.status(200).send('Lead saved and replied');
                }
            } catch (e) {
                console.error("Failed to parse JSON from Gemini", e);
            }
        }

        // Normal conversational reply
        session.history.push({ role: 'model', parts: [{ text: replyText }] });
        await sendWhatsAppMessage(senderId, replyText);

        res.status(200).send('Responded successfully');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error');
    }
});

// API for Frontend Dashboard to fetch leads
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

app.get('/api/leads/poll', async (req, res) => {
    console.log("Polling endpoint hit for new leads UI");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
