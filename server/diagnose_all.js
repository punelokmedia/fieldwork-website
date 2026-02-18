const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("=== DIAGNOSTIC START ===");

async function checkFacebook() {
    console.log("\n1. Checking Facebook Page Token...");
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!token) {
        console.log("❌ Missing FACEBOOK_PAGE_ACCESS_TOKEN");
        return;
    }

    try {
        // debug_token endpoint (Graph API)
        const res = await axios.get(`https://graph.facebook.com/v19.0/debug_token`, {
            params: { input_token: token, access_token: token }
        });
        const data = res.data.data;
        console.log(`- Valid: ${data.is_valid}`);
        console.log(`- Scopes: ${data.scopes}`);
        
        if (data.is_valid) {
             const required = ['pages_manage_posts', 'pages_read_engagement'];
             const missing = required.filter(r => !data.scopes.includes(r));
             if (missing.length > 0) console.log(`❌ Missing Scopes for Posting: ${missing.join(', ')}`);
             else console.log("✅ Ready to Post!");
        } else {
             console.log("❌ Token Invalid/Expired");
             if (data.error) console.log(`error: ${JSON.stringify(data.error)}`);
        }

    } catch (e) {
        console.log("❌ Facebook Check Failed");
        if (e.response) console.log(`Status: ${e.response.status}, Data: ${JSON.stringify(e.response.data)}`);
        else console.log(e.message);
    }
}

async function checkThreads() {
    console.log("\n2. Checking Threads Token...");
    const token = process.env.THREADS_ACCESS_TOKEN;
    if (!token) {
        console.log("❌ Missing THREADS_ACCESS_TOKEN");
        return;
    }

    try {
        // Check /me using Threads API
        const res = await axios.get(`https://graph.threads.net/v1.0/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Connection Success`);
        console.log(`- ID: ${res.data.id}`);
        console.log(`- Username: ${res.data.username}`);
    } catch (e) {
        console.log("❌ Threads Check Failed");
        if (e.response) {
            console.log(`Status: ${e.response.status}`);
            console.log(`Data: ${JSON.stringify(e.response.data)}`);
            if (e.response.status === 500) {
                 console.log("👉 Status 500 usually means the token is NOT a valid Threads token (it might be a Facebook token).");
            }
        } else {
            console.log(e.message);
        }
    }
}

async function run() {
    await checkFacebook();
    await checkThreads();
    console.log("\n=== DIAGNOSTIC END ===");
}

run();
