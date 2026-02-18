const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function checkFacebookToken() {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    console.log("--- Facebook Token Diagnostic ---");
    if (!token) {
        console.error("❌ No FACEBOOK_PAGE_ACCESS_TOKEN found in .env");
        return;
    }

    try {
        // Debug the token metadata
        const debugRes = await axios.get(`https://graph.facebook.com/v19.0/debug_token`, {
            params: { 
                input_token: token,
                access_token: token 
            }
        });

        const data = debugRes.data.data;
        console.log(`Token Valid: ${data.is_valid}`);
        console.log(`Expires At: ${new Date(data.expires_at * 1000).toLocaleString()}`);
        console.log(`Scopes:`, data.scopes);

        if (!data.is_valid) {
            console.error("❌ Token is INVALID.");
            return;
        }

        const required = ['pages_manage_posts', 'pages_read_engagement'];
        const missing = required.filter(req => !data.scopes.includes(req));

        if (missing.length > 0) {
            console.error(`\n❌ CRITICAL ERROR: Missing required permissions:`);
            missing.forEach(m => console.error(`   - ${m}`));
            console.log("\nThis token CANNOT be used to post content. You must generate a new one with these permissions.");
        } else {
            console.log("\n✅ Token has all required permissions!");
        }

        // Check Page Identity
        const meRes = await axios.get(`https://graph.facebook.com/v19.0/me`, {
             params: { access_token: token }
        });
        console.log(`\nToken Identity: ${meRes.data.name} (ID: ${meRes.data.id})`);
        
        if (meRes.data.id !== pageId) {
            console.warn(`⚠️ Warning: Token ID (${meRes.data.id}) does not match FACEBOOK_PAGE_ID (${pageId}) in .env`);
        } else {
            console.log("✅ Token ID matches Page ID.");
        }

    } catch (err) {
        console.error("Diagnostic Error:", err.response ? err.response.data : err.message);
    }
}

checkFacebookToken();
