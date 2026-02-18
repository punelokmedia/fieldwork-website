const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// Initialize OpenAI client
let openai = null;
const initOpenAI = () => {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.includes('sk-')) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return true;
  }
  return false;
};

// Initialize Gemini client
let genAI = null;
const initGemini = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return true;
  }
  return false;
};

// @route   POST /api/ai/enhance-prompt
// @desc    Enhance user prompt using Gemini
// @access  Private
router.post('/enhance-prompt', auth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ msg: 'Prompt required' });

  if (initGemini()) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const promptEnhancement = `Act as a professional AI artist. 
      Transform this concept into a highly descriptive visual prompt: "${prompt}".
      Respond ONLY with the prompt.`;
      
      const result = await model.generateContent(promptEnhancement);
      const enhancedText = result.response.text().trim();
      
      if (enhancedText) {
        return res.json({ enhancedPrompt: enhancedText });
      }
    } catch (e) {
      // Return original prompt silently
      return res.json({ enhancedPrompt: prompt });
    }
  }
  return res.json({ enhancedPrompt: prompt });
});

// @route   POST /api/ai/save-poster
// @desc    Analyze and materialize AI visual to Cloudinary
// @access  Private
router.post('/save-poster', auth, async (req, res) => {
  const { base64Image, imageUrl } = req.body;
  
  if (!base64Image && !imageUrl) {
    return res.status(400).json({ msg: 'Image data or URL required' });
  }

  try {
    let sourceData = base64Image;

    // If a URL is provided, the server bridges the download to bypass CORS
    if (imageUrl) {
      console.log('Neural Bridge: Downloading visual for permanent materialization...');
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const buffer = Buffer.from(response.data, 'binary');
      sourceData = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    console.log('Finalizing Visual Materialization...');
    const uploadResponse = await cloudinary.uploader.upload(sourceData, {
      folder: 'ai_posters',
      resource_type: 'image'
    });

    res.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    });
  } catch (err) {
    console.error('Materialization Error:', err.message);
    res.status(500).json({ msg: 'Failed to materialize synthesis', error: err.message });
  }
});

// Legacy backward compatibility route (Simplified)
router.post('/generate-poster', auth, async (req, res) => {
  res.status(410).json({ msg: 'Please use the newer synthesis pipeline.' });
});

// @route   GET /api/ai/proxy-image
// @desc    Proxy AI images to bypass COEP/CORS blocks
// @access  Public (or Private if you prefer)
router.get('/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL required');

  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // Set appropriate headers for the image
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    response.data.pipe(res);
  } catch (err) {
    console.error('Proxy Error:', err.message);
    res.status(500).send('Failed to proxy image');
  }
});

module.exports = router;
