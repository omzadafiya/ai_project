const axios = require('axios');
async function test() {
    try {
        console.log("Sending chat message to webhook...");
        const res = await axios.post('http://localhost:3000/webhook', {
            sender: "919904362055",
            text: "Mujhe Andheri mein ghar chahiye"
        });
        console.log("Response:", res.data);
    } catch(err) {
        console.error("Error:", err.message);
    }
}
test();
