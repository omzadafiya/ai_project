require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// Serve Static Files from Unified Frontend
const frontendPath = path.join(__dirname, 'frontend/dist');
console.log("Checking frontend path:", frontendPath);
if (fs.existsSync(frontendPath)) {
    console.log("Frontend dist exists!");
} else {
    console.log("CRITICAL: Frontend dist NOT FOUND at", frontendPath);
}
app.use(express.static(frontendPath));

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

// Property Schema
const propertySchema = new mongoose.Schema({
    title: String,
    location: String,
    price: String,
    type: String, // 1BHK, 2BHK, etc.
    imageUrl: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
});
const Property = mongoose.model('Property', propertySchema);

// Message Schema (for Live Chat)
const messageSchema = new mongoose.Schema({
    phoneId: String,
    text: String,
    sender: { type: String, enum: ['user', 'ai', 'agent'] },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Settings Schema (for Human Takeover)
const chatSettingsSchema = new mongoose.Schema({
    phoneId: String,
    aiEnabled: { type: Boolean, default: true }
});
const ChatSettings = mongoose.model('ChatSettings', chatSettingsSchema);

// Chat Session Schema (for Vercel Serverless persistence)
const sessionSchema = new mongoose.Schema({
    phoneId: String,
    history: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now }
});
const ChatSession = mongoose.model('ChatSession', sessionSchema);

const systemPrompt = `You are an expert Real Estate Assistant working for 11za Real Estate on WhatsApp.
Your goal is to collect exactly 3 pieces of information to qualify them:
1) Preferred Location
2) Budget
3) Property Type (1BHK/2BHK/Villa/Commercial)

CRITICAL RULE: You MUST output EVERY SINGLE response as a raw JSON object. NEVER output plain text.
Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Just the raw JSON string.

If you are STILL asking questions to collect the 3 constraints, use this JSON format:
{"complete": false, "replyMsg": "Great! And what is your budget for this property?"}

If you have COLLECTED ALL 3 constraints, you MUST stop asking questions and use this JSON format:
{"complete": true, "location": "Surat", "budget": "10 lakh", "type": "2BHK", "replyMsg": "Thank you! Our agent will contact you shortly with the best properties."}`;

// 11za Send Message API
async function sendWhatsAppMessage(to, text, sender = 'ai') {
    try {
        // Log to database
        await new Message({ phoneId: to, text, sender }).save();

        await axios.post('https://internal.11za.in/apis/sendMessage/sendMessages', {
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

        // Log incoming message to database
        await new Message({ phoneId: senderId, text: incomingText, sender: 'user' }).save();

        // Check if AI is enabled for this user (Human Takeover)
        const settings = await ChatSettings.findOneAndUpdate(
            { phoneId: senderId },
            { $setOnInsert: { aiEnabled: true } },
            { upsert: true, returnDocument: 'after' }
        );

        if (!settings.aiEnabled) {
            console.log(`🤖 AI is disabled for ${senderId}. Waiting for human agent.`);
            return res.status(200).send('AI Disabled');
        }

        // Get or create session from MongoDB (Serverless persistent)
        let session = await ChatSession.findOne({ phoneId: senderId });
        if (!session) {
            session = new ChatSession({ phoneId: senderId, history: [] });
        }
        
        session.history.push({ role: 'user', content: incomingText });

        // Format history for Mistral API, supporting both old Gemini and new formats
        const mistralMessages = [
            { role: 'system', content: systemPrompt },
            ...session.history.map(msg => ({
                role: (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user',
                content: msg.parts ? msg.parts[0].text : (msg.content || '')
            }))
        ];

        // Call Mistral API
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: mistralMessages,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let replyText = response.data.choices[0].message.content.trim();
        replyText = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
        
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

                // --- AI Property Matching (RAG) ---
                const matches = await Property.find({
                    location: { $regex: new RegExp(data.location, 'i') },
                    type: data.type
                }).limit(3);

                let finalReply = data.replyMsg;
                if (matches.length > 0) {
                    const matchText = matches.map(p => `🏠 ${p.title} - ${p.price}\n📍 ${p.location}`).join('\n\n');
                    finalReply = `Perfect! I found some properties matching your requirements in ${data.location}:\n\n${matchText}\n\nOur agent will contact you for more details!`;
                }

                // Send final message and clear session
                await sendWhatsAppMessage(senderId, finalReply);
                await ChatSession.deleteOne({ phoneId: senderId });
                return res.status(200).send('Lead saved and matched');
            }

            // Normal conversational reply
            session.history.push({ role: 'assistant', content: replyText });
            session.updatedAt = Date.now();
            await session.save();
            await sendWhatsAppMessage(senderId, data.replyMsg);
            res.status(200).send('Responded successfully');

        } catch (e) {
            console.error("Failed to parse JSON from Mistral", e, replyText);
            // Fallback if AI messes up JSON format safely
            session.history.push({ role: 'assistant', content: replyText });
            session.updatedAt = Date.now();
            await session.save();
            await sendWhatsAppMessage(senderId, replyText);
            res.status(200).send('Responded fallback');
        }
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

// Property APIs
app.get('/api/properties', async (req, res) => {
    try {
        const props = await Property.find().sort({ createdAt: -1 });
        res.json(props);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

app.post('/api/properties', async (req, res) => {
    try {
        const newProperty = new Property(req.body);
        await newProperty.save();
        res.status(201).json(newProperty);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });
    }
});

app.delete('/api/properties/:id', async (req, res) => {
    try {
        await Property.findByIdAndDelete(req.params.id);
        res.json({ message: 'Property deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

app.put('/api/leads/:id', async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const totalProperties = await Property.countDocuments();
        const statusCounts = await Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        res.json({ totalLeads, totalProperties, statusCounts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/leads/poll', async (req, res) => {
    console.log("Polling endpoint hit for new leads UI");
});

// Chat APIs
app.get('/api/chats/:phoneId', async (req, res) => {
    try {
        const msgs = await Message.find({ phoneId: req.params.phoneId }).sort({ createdAt: 1 });
        res.json(msgs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.get('/api/chat-sessions', async (req, res) => {
    try {
        // Get unique phone numbers that have messaged
        const sessions = await Message.distinct('phoneId');
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

app.post('/api/chat/reply', async (req, res) => {
    try {
        const { phoneId, text } = req.body;
        await sendWhatsAppMessage(phoneId, text, 'agent');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send agent reply' });
    }
});

app.post('/api/chat/toggle-ai', async (req, res) => {
    try {
        const { phoneId, enabled } = req.body;
        await ChatSettings.findOneAndUpdate({ phoneId }, { aiEnabled: enabled }, { upsert: true });
        res.json({ success: true, aiEnabled: enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle AI' });
    }
});

app.get('/api/chat/status/:phoneId', async (req, res) => {
    try {
        const settings = await ChatSettings.findOne({ phoneId: req.params.phoneId });
        res.json({ aiEnabled: settings ? settings.aiEnabled : true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

// React SPA Fallback Route
// SPA Fallback: Serve index.html for all other non-API/webhook routes
app.get(/^(.*)$/, (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/webhook')) {
        const indexPath = path.join(__dirname, 'frontend/dist/index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send("Frontend build not found. Please wait for the build to complete.");
        }
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
