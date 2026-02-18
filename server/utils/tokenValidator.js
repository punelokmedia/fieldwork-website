const axios = require('axios');

async function checkFacebookToken() {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!token || !pageId) {
        console.warn("⚠️ Social Media: Facebook Page Access Token or Page ID missing in .env. Facebook publishing will not work.");
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
        if (!data.is_valid) {
            console.error("❌ Social Media: Facebook Page Access Token is INVALID or EXPIRED.");
            return;
        }

        const scopes = data.scopes || [];
        const missing = [];
        const required = ['pages_manage_posts', 'pages_read_engagement'];

        required.forEach(req => {
            if (!scopes.includes(req)) missing.push(req);
        });

        if (missing.length > 0) {
            console.error(`❌ Social Media Configuration Error:`);
            console.error(`   The provided FACEBOOK_PAGE_ACCESS_TOKEN is valid but missing required permissions:`);
            console.error(`   Missing: ${missing.join(', ')}`);
            console.error(`   Please regenerate the token with these permissions to enable Facebook publishing.`);
        } else {
            console.log("✅ Social Media: Facebook Token is valid and has required permissions.");
        }

    } catch (err) {
        // Silent fail on network error to not block server start, or log warning
        console.warn("⚠️  Social Media: Could not validate Facebook Token on startup (Network or Token issue).");
    }
}

async function checkInstagramToken() {
    // Similar check for Instagram if needed, though they often share the base user token permissions
    // For now, focusing on the reported Facebook issue
}

async function validateTokens() {
    console.log("Validating Social Media Tokens...");
    await checkFacebookToken();
    // await checkInstagramToken();
}

module.exports = validateTokens;
