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
    senderName: String,
    location: String,
    budget: String,
    propertyType: String,
    status: { type: String, default: 'Qualified' },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
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
    senderName: String,
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
    senderName: String,
    history: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now }
});
const ChatSession = mongoose.model('ChatSession', sessionSchema);

// Global System Config (for dynamic Prompts)
const configSchema = new mongoose.Schema({
    key: String,
    value: String
});
const SystemConfig = mongoose.model('SystemConfig', configSchema);

// Agent Schema
const agentSchema = new mongoose.Schema({
    name: String,
    phone: String,
    role: { type: String, default: 'Agent' },
    status: { type: String, default: 'Offline' },
    leads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const Agent = mongoose.model('Agent', agentSchema);

async function getSystemPrompt() {
    let config = await SystemConfig.findOne({ key: 'systemPrompt' });
    if (!config) {
        const defaultPrompt = `=========================================================
ROLE & CONTEXT:
You are "Astro", an elite AI Real Estate Advisor representing 11za Realty.
You communicate exclusively via WhatsApp. Target Audience: High-Net-Worth Individuals.

TONE & PERSONALITY:
- Extremely polite, professional, and empathetic. Concise yet highly informative.
- Mirror the user's language EXACTLY (e.g., reply in pure Gujarati if they speak Gujarati).

CORE MISSION:
Collect exactly 4 critical constraints politely, ONE STEP AT A TIME:
1. Preferred Location (Micro-markets, specific areas)
2. Budget Approximation (e.g., "50 Lakhs", "2 Crores", "Undecided")
3. Property Configuration (1BHK/2BHK/Villa/Commercial/Land)
4. Site Visit Readiness (e.g., "Would you like a VIP site tour this weekend? Yes/No")

=========================================================
OUTPUT DIRECTIVES (STRICT COMPLIANCE REQUIRED):
You are a backend system router. You MUST output EVERY response strictly as a minified JSON object. NEVER use markdown formatting (like \`\`\`json). No conversational filler outside the JSON.

SCENARIO A: STILL COLLECTING CONSTRAINTS
If any constraints are missing:
{"complete": false, "replyMsg": "[Your warm, localized text asking the next missing question]"}

SCENARIO B: ALL 4 CONSTRAINTS COLLECTED
Stop asking questions and output:
{"complete": true, "location": "[Extracted Location]", "budget": "[Extracted Budget]", "type": "[Extracted Type]", "siteVisit": "[Yes/No]", "replyMsg": "[Your warm closing message]"}
Example: {"complete": true, "location": "Vesu", "budget": "2 Cr", "type": "4BHK", "siteVisit": "Yes", "replyMsg": "Perfect. Allow me a moment to curate the finest properties for you..."}`;
        config = await new SystemConfig({ key: 'systemPrompt', value: defaultPrompt }).save();
    }
    return config.value;
}

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
        const senderName = (req.body.whatsapp && req.body.whatsapp.senderName) || 'Client';
        const incomingText = req.body.UserResponse || (req.body.content && req.body.content.text) || req.body.text || "";

        if (!incomingText) return res.status(200).send('No text found');

        // Log incoming message to database
        await new Message({ phoneId: senderId, senderName, text: incomingText, sender: 'user' }).save();

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
        let session = await ChatSession.findOneAndUpdate(
            { phoneId: senderId },
            { $set: { senderName, updatedAt: Date.now() } },
            { new: true }
        );
        if (!session) {
            session = new ChatSession({ phoneId: senderId, senderName, history: [] });
        }

        session.history.push({ role: 'user', content: incomingText });

        // Format history for Mistral API, supporting both old Gemini and new formats
        const currentSystemPrompt = await getSystemPrompt();
        const mistralMessages = [
            { role: 'system', content: currentSystemPrompt },
            ...session.history.map(msg => ({
                role: (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user',
                content: msg.parts ? msg.parts[0].text : (msg.content || '')
            }))
        ];

        // Call Mistral API
        let mistralKeyConfig = await SystemConfig.findOne({ key: 'mistralKey' });
        const mistralApiKey = mistralKeyConfig && mistralKeyConfig.value ? mistralKeyConfig.value : process.env.MISTRAL_API_KEY;

        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: mistralMessages,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${mistralApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        let replyText = response.data.choices[0].message.content.trim();
        replyText = replyText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(replyText);
            let finalReply = data.replyMsg;

            if (data.complete) {
                if (data.isFollowUp) {
                    finalReply = data.replyMsg;
                    const existingLead = await Lead.findOne({ phoneId: senderId }).populate('assignedAgent');
                    if (existingLead && existingLead.assignedAgent && existingLead.assignedAgent.phone) {
                        const agentMsg = `🚨 *Client Replied to Follow-up!*\n*Name:* ${senderName}\n*Message:* ${incomingText}\n*AI Replied:* ${finalReply}\n\nPlease prepare the documents/floor plans for them!`;
                        await sendWhatsAppMessage(existingLead.assignedAgent.phone.replace(/[^0-9]/g, ''), agentMsg, 'agent');
                    }
                } else {
                    const existingLead = await Lead.findOne({ phoneId: senderId });
                    if (!existingLead) {
                        await new Lead({
                            phoneId: senderId,
                            senderName,
                            location: data.location,
                            budget: data.budget,
                            propertyType: data.type,
                            status: 'Qualified'
                        }).save();
                    }
                    const matches = await Property.find({ location: new RegExp(data.location, 'i') }).limit(3);
                    if (matches.length > 0) {
                        const matchText = matches.map(p => `*🏠 ${p.title}*\n*💰 Price:* ${p.price}\n*📍 Location:* ${p.location}\n*📝 Details:* ${p.description || 'Premium property ready to move in.'}\n*🖼️ View Property:* ${p.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'}`).join('\n\n------------------\n\n');
                        finalReply = `${data.replyMsg}\n\nHere are the top matches for you in *${data.location}*:\n\n${matchText}\n\nOur executive will coordinate with you shortly ${data.siteVisit === 'Yes' || data.siteVisit === 'yes' ? 'to confirm your site visit slot!' : 'for more details!'}`;
                    }
                }

                await sendWhatsAppMessage(senderId, finalReply);
                await ChatSession.deleteOne({ phoneId: senderId });
                return res.status(200).send('Lead saved and matched');
            }

            // Normal conversational reply
            session.history.push({ role: 'assistant', content: replyText });
            session.updatedAt = Date.now();
            await session.save();
            await sendWhatsAppMessage(senderId, data.replyMsg);
            return res.status(200).send('Responded successfully');

        } catch (e) {
            console.error("Failed to parse JSON from Mistral", e, replyText);
            session.history.push({ role: 'assistant', content: replyText });
            session.updatedAt = Date.now();
            await session.save();
            await sendWhatsAppMessage(senderId, replyText);
            return res.status(200).send('Responded fallback');
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
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/properties/:id', async (req, res) => {
    try {
        const prop = await Property.findById(req.params.id);
        res.json(prop);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
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
        const lead = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(lead);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/leads/:id/assign', async (req, res) => {
    try {
        const { agentId } = req.body;
        const lead = await Lead.findByIdAndUpdate(req.params.id, { assignedAgent: agentId }, { new: true });
        const agent = await Agent.findById(agentId);

        if (agent && agent.phone) {
            const agentMsg = `🚨 *New VIP Lead Assigned*\n\n*Name:* ${lead.senderName || lead.phoneId}\n*Requirement:* ${lead.propertyType} in ${lead.location}\n*Budget:* ${lead.budget}\n\nPlease contact them ASAP!`;
            await sendWhatsAppMessage(agent.phone.replace(/[^0-9]/g, ''), agentMsg, 'agent');
            await Agent.findByIdAndUpdate(agentId, { $inc: { leads: 1 } });
        }
        res.json(lead);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/campaigns/followup', async (req, res) => {
    try {
        // Find qualified leads
        const leads = await Lead.find({ status: { $in: ['Qualified', 'Follow Up'] } });
        let count = 0;

        for (const lead of leads) {
            const followUpMsg = `Hello ${lead.senderName ? lead.senderName.split(' ')[0] : 'Sir/Madam'}, this is Astro from 11za Realty. I shared some premium properties with you recently.\n\nWould you like me to share the detailed *3D floor-plans and high-res video walkthroughs* for those matches?`;

            await sendWhatsAppMessage(lead.phoneId, followUpMsg, 'ai');

            // Append to session history so Mistral knows the context when user replies
            await ChatSession.findOneAndUpdate(
                { phoneId: lead.phoneId },
                {
                    $push: { history: { role: 'assistant', content: followUpMsg } },
                    $set: { updatedAt: Date.now() }
                }
            );
            count++;
        }
        res.json({ success: true, count });
    } catch (error) {
        console.error('Campaign Error:', error);
        res.status(500).json({ error: 'Failed to launch automated campaign' });
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
        const sessions = await ChatSession.find({}, 'phoneId senderName updatedAt').sort({ updatedAt: -1 });
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

// --- V2 Dashboard APIs ---
app.get('/api/settings/prompt', async (req, res) => {
    try {
        const prompt = await getSystemPrompt();
        res.json({ prompt });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prompt' });
    }
});

app.put('/api/settings/prompt', async (req, res) => {
    try {
        await SystemConfig.findOneAndUpdate(
            { key: 'systemPrompt' },
            { value: req.body.prompt },
            { upsert: true }
        );
        res.json({ success: true, prompt: req.body.prompt });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update prompt' });
    }
});

app.get('/api/settings/keys', async (req, res) => {
    try {
        const keyConfig = await SystemConfig.findOne({ key: 'mistralKey' });
        res.json({ mistralKey: keyConfig ? keyConfig.value : '' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.put('/api/settings/keys', async (req, res) => {
    try {
        await SystemConfig.findOneAndUpdate(
            { key: 'mistralKey' },
            { value: req.body.mistralKey },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/agents', async (req, res) => {
    try {
        const agents = await Agent.find().sort({ createdAt: -1 });
        res.json(agents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});

app.post('/api/agents', async (req, res) => {
    try {
        const newAgent = new Agent(req.body);
        await newAgent.save();
        res.json(newAgent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add agent' });
    }
});

app.put('/api/agents/:id', async (req, res) => {
    try {
        const updatedAgent = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedAgent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update agent' });
    }
});

app.delete('/api/agents/:id', async (req, res) => {
    try {
        await Agent.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete agent' });
    }
});


// ─────────────────────────────────────────────
// V7: AI PDF PROPERTY IMPORTER
// ─────────────────────────────────────────────
const multer = require('multer');
const pdfParse = require('pdf-parse');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/properties/import-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

        // Extract raw text from the PDF buffer
        const pdfData = await pdfParse(req.file.buffer);
        const rawText = pdfData.text.substring(0, 4000); // Take first 4000 chars to avoid token overflow

        // Ask Mistral to extract property data from the extracted text
        let mistralKeyConfig = await SystemConfig.findOne({ key: 'mistralKey' });
        const mistralApiKey = (mistralKeyConfig && mistralKeyConfig.value) ? mistralKeyConfig.value : process.env.MISTRAL_API_KEY;

        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'user',
                    content: `You are a real estate data extraction assistant. Extract all property listings from the following text and return a JSON array of objects. Each object should have these fields: title, price, location, type, description, imageUrl (set to "" if not found). If multiple properties are described, return all of them. If it is a single property, return an array with one object. ONLY output the raw JSON array, nothing else.\n\nText:\n${rawText}`
                }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${mistralApiKey}`, 'Content-Type': 'application/json' }
        });

        let extracted = JSON.parse(response.data.choices[0].message.content.trim());
        // Mistral might return { properties: [...] } or just [...]
        const properties = Array.isArray(extracted) ? extracted : (extracted.properties || extracted.listings || [extracted]);

        const saved = [];
        for (const prop of properties) {
            if (prop.title && prop.location) {
                const newProp = await new Property({
                    title: prop.title || 'Unnamed Property',
                    price: prop.price || 'On Request',
                    location: prop.location || 'Unknown',
                    type: prop.type || '2BHK',
                    description: prop.description || '',
                    imageUrl: prop.imageUrl || ''
                }).save();
                saved.push(newProp);
            }
        }

        res.json({ success: true, count: saved.length, properties: saved });
    } catch (error) {
        console.error('PDF Import Error:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to process PDF', details: error.message });
    }
});

// ─────────────────────────────────────────────
// V7: ANALYTICS ENGINE
// ─────────────────────────────────────────────
app.get('/api/analytics', async (req, res) => {
    try {
        // Conversion Funnel by status
        const funnel = await Lead.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Agent Leaderboard — leads assigned per agent
        const agentLeaderboard = await Lead.aggregate([
            { $match: { assignedAgent: { $exists: true, $ne: null } } },
            { $group: { _id: '$assignedAgent', leadCount: { $sum: 1 } } },
            { $lookup: { from: 'agents', localField: '_id', foreignField: '_id', as: 'agentInfo' } },
            { $unwind: { path: '$agentInfo', preserveNullAndEmptyArrays: true } },
            { $project: { leadCount: 1, agentName: '$agentInfo.name', agentPhone: '$agentInfo.phone' } },
            { $sort: { leadCount: -1 } },
            { $limit: 10 }
        ]);

        // Top Locations
        const topLocations = await Lead.aggregate([
            { $match: { location: { $exists: true, $ne: '' } } },
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        // Lead inflow last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dailyInflow = await Lead.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Property type distribution
        const propertyTypeDist = await Lead.aggregate([
            { $match: { propertyType: { $exists: true, $ne: '' } } },
            { $group: { _id: '$propertyType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({ funnel, agentLeaderboard, topLocations, dailyInflow, propertyTypeDist });
    } catch (error) {
        console.error('Analytics Error:', error.message);
        res.status(500).json({ error: 'Analytics aggregation failed' });
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
