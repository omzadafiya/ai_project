require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'astro_estate_secret_2024';

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

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, username });
    }
    return res.status(401).json({ error: 'Invalid username or password' });
});

app.get('/api/auth/verify', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ valid: false });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
        return res.json({ valid: true, username: decoded.username });
    } catch {
        return res.status(401).json({ valid: false });
    }
});



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
            { 
                $set: { senderName, updatedAt: Date.now() },
                $setOnInsert: { phoneId: senderId, history: [] }
            },
            { new: true, upsert: true }
        );
        if (!session) {
            session = new ChatSession({ phoneId: senderId, senderName, history: [] });
            await session.save();
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
                        const matchText = matches.map((p, i) => {
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                        return `${medal} *Option ${i + 1}: ${p.title}*\n━━━━━━━━━━━━━━━━━━\n💰 *Price:* ${p.price}\n📍 *Location:* ${p.location}\n🏠 *Type:* ${p.type || data.type}\n📝 *Highlights:* ${p.description || 'Ready to move in. Premium amenities.'}\n🖼️ *View Photos:* ${p.imageUrl || 'Contact us for photos'}`;
                    }).join('\n\n');

                    const siteVisitLine = (data.siteVisit === 'Yes' || data.siteVisit === 'yes')
                        ? `\n\n📅 *Site Visit:* Our executive will call you shortly to confirm your *FREE VIP site tour* slot!`
                        : `\n\n📞 *Next Step:* Our property consultant will reach out to you shortly with more details.`;

                    finalReply = `${data.replyMsg}\n\n✨ *Your Curated Matches in ${data.location}*\n━━━━━━━━━━━━━━━━━━━━\n\n${matchText}${siteVisitLine}\n\n_— Astro | 11za Realty | Your Trusted Property Partner_ 🏡`;

                    }
                }

                await sendWhatsAppMessage(senderId, finalReply);
                // Keep session alive so Live Chat shows the full conversation
                session.history.push({ role: 'assistant', content: finalReply });
                session.updatedAt = Date.now();
                await session.save();
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
            const leadPhone = lead.phoneId ? '\n*Mobile:* +' + lead.phoneId : '';
            const agentMsg = `🚨 *New VIP Lead Assigned*\n\n*Name:* ${lead.senderName || 'Client'}${leadPhone}\n*Requirement:* ${lead.propertyType || 'N/A'} in ${lead.location || 'N/A'}\n*Budget:* ${lead.budget || 'N/A'}\n\n📞 Please contact them on WhatsApp ASAP!`;
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
            const name = lead.senderName ? lead.senderName.split(' ')[0] : 'Sir/Madam';
            const followUpMsg = `Hello ${name}! 👋\n\nYe *Astro* bol raha hun, *11za Realty* se. 🏡\n\nHumne kuch time pehle aapki property requirement ke baare mein baat ki thi.\n\nKya aap abhi bhi ghar dhundh rahe hain? 😊\n\nSirf *Ha* ya *Yes* reply karo — hum aapki poori help karenge!`;
            
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

// Chat APIs — serve full conversation from ChatSession history
app.get('/api/chats/:phoneId', async (req, res) => {
    try {
        const session = await ChatSession.findOne({ phoneId: req.params.phoneId });
        if (!session) return res.json([]);
        // Map history to a format LiveChat.jsx can render
        const msgs = (session.history || []).map((msg, i) => ({
            _id: `${session._id}_${i}`,
            phoneId: req.params.phoneId,
            sender: (msg.role === 'user') ? 'user' : 'ai',
            text: msg.parts ? msg.parts[0].text : (msg.content || ''),
            createdAt: session.updatedAt || session.createdAt
        }));
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

// Generic Settings Config (for company info, follow-up message, etc.)
app.get('/api/settings/config', async (req, res) => {
    try {
        const configs = await SystemConfig.find({ key: { $in: ['companyName', 'companyPhone', 'whatsappNumber', 'followUpMessage', 'botLanguage', 'maxLeadsPerAgent'] } });
        const result = {};
        configs.forEach(c => { result[c.key] = c.value; });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

app.put('/api/settings/config', async (req, res) => {
    try {
        const updates = req.body; // { key: value, key2: value2 }
        for (const [key, value] of Object.entries(updates)) {
            await SystemConfig.findOneAndUpdate({ key }, { value }, { upsert: true });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save config' });
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
