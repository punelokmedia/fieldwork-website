const axios = require('axios');
const path = require('path');
// Load .env from the server directory, regardless of where script is run from
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function checkThreadsToken() {
    const token = process.env.THREADS_ACCESS_TOKEN;
    
    if (!token) {
        console.error("❌ No Threads Access Token found in .env");
        return;
    }

    console.log(`Checking Threads Token...`);

    try {
        const res = await axios.get(`https://graph.threads.net/v1.0/me`, {
             params: { 
                fields: 'id,username,name,threads_biography',
                access_token: token
             }
        });

        console.log("\n--- Threads Identity ---");
        console.log(`ID: ${res.data.id}`);
        console.log(`Username: ${res.data.username}`);
        console.log(`Name: ${res.data.name}`);
        console.log("✅ Token is valid for Threads API.");    

    } catch (err) {
        console.error("\n❌ Threads Token Check Failed:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Data:`, JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

checkThreadsToken();
