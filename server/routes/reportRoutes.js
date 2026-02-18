const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const multer = require('multer');
const path = require('path');
const socialMedia = require('../utils/socialMedia');

const { upload, cloudinary } = require('../config/cloudinary');

// @route   GET /api/reports/upload-signature
// @desc    Get signature for client-side upload
// @access  Private
router.get('/upload-signature', auth, (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'field_reports'
    }, process.env.CLOUDINARY_API_SECRET);
    
    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (err) {
    console.error('Signature Error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/reports
// @desc    Create a report
// @access  Private
router.post('/', auth, upload.array('media'), async (req, res) => {
  try {
    const { title, description, latitude, longitude, address, keywords, hashtags, mediaItems } = req.body;
    
    // Convert strings to arrays
    const seoKeywords = Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []);
    const socialHashtags = Array.isArray(hashtags) ? hashtags : (hashtags ? hashtags.split(',').map(h => h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`) : []);
    
    let media = [];
    
    // Process uploaded files (server-side upload)
    if (req.files && req.files.length > 0) {
        media = req.files.map((file, index) => ({
          url: file.path,
          publicId: file.filename,
          type: file.mimetype.startsWith('video') ? 'video' : file.mimetype.startsWith('audio') ? 'audio' : 'image',
          caption: (Array.isArray(req.body.captions) ? req.body.captions[index] : req.body.captions) || ''
        }));
    } 
    // Process pre-uploaded media (client-side upload optimization)
    else if (mediaItems) {
        try {
            media = typeof mediaItems === 'string' ? JSON.parse(mediaItems) : mediaItems;
        } catch (e) {
            console.error("Error parsing mediaItems:", e);
            media = [];
        }
    }
    
    const newReport = new Report({
      title,
      description,
      location: {
        latitude,
        longitude,
        address
      },
      media, 
      keywords: seoKeywords,
      hashtags: socialHashtags,
      reporterId: req.user.id
    });

    const report = await newReport.save();
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/reports
// @desc    Get all reports (with optional filtering)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'field_work') {
        // Field Work users see their own reports
        query.reporterId = req.user.id;
    }
    // Admins/Managers see all.
    // Allow basic status filtering via query params
    if (req.query.status) {
        query.status = req.query.status;
    }

    const reports = await Report.find(query).sort({ createdAt: -1 }).populate('reporterId', 'name');
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report (e.g. status or content)
// @access  Private (Manager/Admin or Owner)
// @route   PUT /:id
// @desc    Update report
// @access  Private
router.put('/:id', [auth, upload.array('media')], async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ msg: 'Report not found' });

    // Check user permissions
    if (report.reporterId.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const { title, description, status, latitude, longitude, address, keywords, hashtags } = req.body;
    
    // Update keywords if provided
    if (keywords !== undefined) {
        report.keywords = Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []);
    }
    
    // Update hashtags if provided
    if (hashtags !== undefined) {
        report.hashtags = Array.isArray(hashtags) ? hashtags : (hashtags ? hashtags.split(',').map(h => h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`) : []);
    }

    // Update fields
    if (title) report.title = title;
    if (description) report.description = description;
    
    // Update location if provided
    if (latitude && longitude) {
        report.location = {
            latitude,
            longitude,
            address: address || report.location.address
        };
    }

    // Support caption updates for existing media if no new files uploaded
    if ((!req.files || req.files.length === 0) && req.body.captions) {
        if (report.media && report.media.length > 0) {
            const captions = Array.isArray(req.body.captions) ? req.body.captions : [req.body.captions];
            // If it's a single string but we have multiple media, it might be tricky, 
            // but usually we have 1 media item or we send an array.
            report.media.forEach((m, index) => {
                if (captions[index] !== undefined) {
                    m.caption = captions[index];
                }
            });
        }
    }

    // Handle Media Updates
    let hasMediaUpdates = false;

    // 1. Server-side upload
    if (req.files && req.files.length > 0) {
        const newMedia = req.files.map((file, index) => ({
            url: file.path,
            publicId: file.filename,
            type: file.mimetype.startsWith('video') ? 'video' : file.mimetype.startsWith('audio') ? 'audio' : 'image',
            caption: (Array.isArray(req.body.captions) ? req.body.captions[index] : req.body.captions) || ''
        }));
        report.media = newMedia;
        hasMediaUpdates = true;
    }
    // 2. Client-side pre-upload (Optimized)
    else if (req.body.mediaItems) {
        try {
            report.media = typeof req.body.mediaItems === 'string' ? JSON.parse(req.body.mediaItems) : req.body.mediaItems;
            hasMediaUpdates = true;
        } catch(e) { console.error(e); }
    }

    // Status updates
    if (status) {
         if (req.user.role === 'admin') {
             report.status = status;
         } else if (req.user.role === 'field_work' && (status === 'draft' || status === 'pending')) {
             report.status = status;
         }
    }

    await report.save();
    res.json(report);
  } catch (err) {
    console.error('PUT /:id Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message, details: err.toString() });
  }
});

// @route   DELETE /:id
// @desc    Delete report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Check user permissions
    if (report.reporterId.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Delete media from Cloudinary
    if (report.media && report.media.length > 0) {
        try {
            const deletePromises = report.media.map(file => {
                if (file.publicId) {
                    // Default to 'image' if type is missing or not video/raw
                    const resourceType = file.type === 'video' ? 'video' : 'image';
                    return cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType });
                }
                return Promise.resolve();
            });
            await Promise.all(deletePromises);
            console.log(`Deleted ${report.media.length} media files from Cloudinary for report ${report._id}`);
        } catch (mediaErr) {
            console.error("Error deleting media from Cloudinary:", mediaErr);
            // Continue to delete from DB even if Cloudinary delete fails
        }
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Report removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/reports/:id/share
// @desc    Share report to social media
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ msg: 'Report not found' });

    const { platforms } = req.body; 
    // platforms is expected to be an object like { facebook: true, instagram: false } 
    // or an array ['facebook', 'instagram']
    // Let's normalize it to an array of strings
    let targetPlatforms = [];
    if (Array.isArray(platforms)) {
        targetPlatforms = platforms;
    } else if (typeof platforms === 'object') {
        targetPlatforms = Object.keys(platforms).filter(key => platforms[key]);
    }

    const results = {};
    const errors = {};

    console.log(`Sharing report ${report._id} to:`, targetPlatforms);

    if (targetPlatforms.includes('facebook')) {
        try {
            const fbRes = await socialMedia.publishToFacebook(report);
            results.facebook = { success: true, data: fbRes.data };
        } catch (err) {
            console.error('Facebook publish error:', err.response ? err.response.data : err.message);
            
            let errorDetail = err.response ? err.response.data : err.message;
            if (err.response && err.response.data && err.response.data.error) {
                const fbError = err.response.data.error;
                // Facebook returns a confusing "publish_actions" error when "pages_manage_posts" is missing
                if (fbError.code === 200 && (fbError.message.includes('pages_manage_posts') || fbError.message.includes('publish_actions'))) {
                     errorDetail = {
                         message: "MISSING PERMISSION: Your Facebook Page Access Token is missing 'pages_manage_posts'. Please generate a new token with this permission.",
                         original_error: fbError
                     };
                }
            }
            errors.facebook = errorDetail;
        }
    }

    if (targetPlatforms.includes('instagram')) {
        try {
            const igRes = await socialMedia.publishToInstagram(report);
            results.instagram = { success: true, data: igRes.data };
        } catch (err) {
            console.error('Instagram publish error:', err.response ? JSON.stringify(err.response.data) : err.message);
            
            let errorDetail = err.response ? err.response.data : err.message;
            if (err.response && err.response.data && err.response.data.error) {
                const igError = err.response.data.error;
                if (igError.code === 10 && igError.message.includes('permission')) {
                    errorDetail = {
                        message: "MISSING PERMISSION: Your Instagram Access Token is missing 'instagram_content_publish'. Please generate a new token with this permission.",
                        original_error: igError
                    };
                }
            }
            errors.instagram = errorDetail;
        }
    }

    if (targetPlatforms.includes('threads')) {
         try {
            const thRes = await socialMedia.publishToThreads(report);
            results.threads = { success: true, data: thRes.data };
        } catch (err) {
             console.error('Threads publish error:', err.response ? JSON.stringify(err.response.data) : err.message);
             errors.threads = err.response ? err.response.data : err.message;
        }
    }

    res.json({ results, errors });

  } catch (err) {
    console.error('Share Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
