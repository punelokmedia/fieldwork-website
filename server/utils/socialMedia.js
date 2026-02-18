const axios = require('axios');

async function publishToFacebook(report) {
    console.log('Publishing to Facebook...');
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;

    let data = {
        access_token: accessToken,
        message: `${report.title}\n\n${report.description || ''}\n\n${report.hashtags ? report.hashtags.join(' ') : ''}`
    };

    if (report.media && report.media.length > 0) {
        // If media exists, we try to post as a photo or video.
        // For simplicity, let's pick the first media item.
        const mediaItem = report.media[0];
        if (mediaItem.type === 'image') {
            data.url = mediaItem.url; // Assuming public URL (Cloudinary)
            // If posting photo, endpoint is different
            console.log('Posting photo to Facebook');
            return await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, data);
        } else if (mediaItem.type === 'video') {
             // For video, we might need a different approach or just link to it if file upload is complex
             // Using link for now if video file is hosted publicly
             data.link = mediaItem.url;
             console.log('Posting video link to Facebook');
             return await axios.post(url, data);
        }
    }

    // Default: Text post
    console.log('Posting text to Facebook');
    return await axios.post(url, data);
}

async function publishToInstagram(report) {
    console.log('Publishing to Instagram...');
    const userId = process.env.INSTAGRAM_BUSINESS_ID;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!report.media || report.media.length === 0) {
        throw new Error('Instagram requires media (image or video) to post.');
    }

    const mediaItem = report.media[0];
    const imageUrl = mediaItem.url;
    const caption = `${report.title}\n\n${report.description || ''}\n\n${report.hashtags ? report.hashtags.join(' ') : ''}`;

    // Step 1: Create Container
    const containerUrl = `https://graph.facebook.com/v19.0/${userId}/media`;
    let containerData = {
        access_token: accessToken,
        caption: caption
    };

    if (mediaItem.type === 'video') {
        containerData.media_type = 'VIDEO';
        containerData.video_url = imageUrl;
    } else {
        containerData.image_url = imageUrl;
    }

    const containerRes = await axios.post(containerUrl, {}, { params: containerData });
    const creationId = containerRes.data.id;

    // Step 2: Publish Container
    const publishUrl = `https://graph.facebook.com/v19.0/${userId}/media_publish`;
    const publishRes = await axios.post(publishUrl, {}, {
        params: {
            creation_id: creationId,
            access_token: accessToken
        }
    });

    return publishRes;
}

async function publishToThreads(report) {
    console.log('Publishing to Threads...');
    const userId = "me"; // Threads might need 'me' or specific user ID if token is user scoped
    // The documentation typically says POST https://graph.threads.net/v1.0/{user_id}/threads
    // But 'me' often works if the token is user token. However, user provided explicit credentials.
    // Let's assume the token is valid for the user context.
    
    // Wait, Threads API documentation says:
    // POST https://graph.threads.net/v1.0/{threads-user-id}/threads
    // If not sure about ID, let's try 'me' first? standard Graph API behavior. 
    // Actually best to use the token to get the ID if needed?
    // But for now let's try 'me' or if we have an ID in env? No specific Threads User ID in env, only App ID.
    // Wait, user provided THREADS_ACCESS_TOKEN.
    
    // Actually, user provided credentials but no specific User ID in the env variables for Threads (only App ID and Secret).
    // Ah, wait - the prompt has:
    // # THREADS
    // THREADS_APP_ID=...
    // THREADS_APP_SECRET=...
    // THREADS_ACCESS_TOKEN=...
    
    // Unlike Instagram/Facebook where Page ID / Business ID was provided.
    // So for Threads, I'll use 'me' as the user ID.
    
    const accessToken = process.env.THREADS_ACCESS_TOKEN;
    const url = `https://graph.threads.net/v1.0/me/threads`;

    const text = `${report.title}\n\n${report.description || ''}\n\n${report.hashtags ? report.hashtags.join(' ') : ''}`;

    let params = {
        access_token: accessToken,
        text: text,
        media_type: 'TEXT'
    };

    if (report.media && report.media.length > 0) {
        const mediaItem = report.media[0];
        if (mediaItem.type === 'image') {
            params.media_type = 'IMAGE';
            params.image_url = mediaItem.url;
        } else if (mediaItem.type === 'video') {
            params.media_type = 'VIDEO';
            params.video_url = mediaItem.url;
        }
    }

    // Threads is also 2-step: Create -> Publish
    // Step 1: Create Item
    console.log('Creating Threads item container...');
    // Note: Threads API might require different parameters (e.g. 'text' handling).
    // Let's stick to standard docs pattern:
    // POST /threads?media_type=IMAGE&image_url=...&text=...
    
    const creationRes = await axios.post(url, {}, { params: params });
    const creationId = creationRes.data.id;

    // Step 2: Publish
    console.log('Publishing Threads item...');
    const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
    const publishRes = await axios.post(publishUrl, {}, {
        params: {
            creation_id: creationId,
            access_token: accessToken
        }
    });

    return publishRes;
}

module.exports = {
    publishToFacebook,
    publishToInstagram,
    publishToThreads
};
