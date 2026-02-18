const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function checkUserToken() {
    const token = process.env.META_USER_ACCESS_TOKEN;

    console.log("--- User Token Diagnostic ---");
    if (!token) {
        console.error("❌ No META_USER_ACCESS_TOKEN found in .env");
        return;
    }

    try {
        const debugRes = await axios.get(`https://graph.facebook.com/v19.0/debug_token`, {
            params: { 
                input_token: token,
                access_token: token 
            }
        });

        const data = debugRes.data.data;
        console.log(`Token Valid: ${data.is_valid}`);
        console.log(`Scopes:`, data.scopes);

    } catch (err) {
        console.error("Diagnostic Error:", err.response ? err.response.data : err.message);
    }
}

checkUserToken();
