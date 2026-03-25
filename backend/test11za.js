const axios = require('axios');

async function test11za() {
    try {
        console.log("Sending direct test POST to 11za API...");
        const res = await axios.post('https://api.11za.in/apis/sendMessage/sendMessages', {
            sendto: "919904843058",
            authToken: "U2FsdGVkX18JbiMX7+KaxddJRrdaj/AA3908jmMBd0Ph5CfDkEvqbqAlwDI2kO5aRsVc+0NiWBq7ImzM7Tb0ac8p1insyB5Hj7FqRFqKUx0lC1qfvw+nja5n0BH10HnfQUv9veOAOyN+wvnpIMm9hBlsnDRm2rSyBSt6IaEBYRf6YvORLTQNln1qOFtDFC0B",
            originWebsite: "https://engees.in",
            contentType: "text",
            text: "This is a direct API debugging test."
        });
        
        console.log("HTTP Status:", res.status);
        console.log("API Response Body:", JSON.stringify(res.data, null, 2));

        // Also test the internal URL just in case
        console.log("\nAttempting internal domain...");
        const res2 = await axios.post('https://internal.11za.in/apis/sendMessage/sendMessages', {
            sendto: "919904843058",
            authToken: "U2FsdGVkX18JbiMX7+KaxddJRrdaj/AA3908jmMBd0Ph5CfDkEvqbqAlwDI2kO5aRsVc+0NiWBq7ImzM7Tb0ac8p1insyB5Hj7FqRFqKUx0lC1qfvw+nja5n0BH10HnfQUv9veOAOyN+wvnpIMm9hBlsnDRm2rSyBSt6IaEBYRf6YvORLTQNln1qOFtDFC0B",
            originWebsite: "https://engees.in",
            contentType: "text",
            text: "This is a direct API debugging test (Internal domain)."
        });
        console.log("HTTP Status 2:", res2.status);
        console.log("API Response Body 2:", JSON.stringify(res2.data, null, 2));

    } catch (err) {
        console.error("AXIOS ERROR:", err.message);
        if (err.response) {
            console.error("Error Response Body:", JSON.stringify(err.response.data, null, 2));
        }
    }
}

test11za();
