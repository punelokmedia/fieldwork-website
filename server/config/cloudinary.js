const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'field_reports',
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'mp3', 'wav'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage: storage });
module.exports = { upload, cloudinary };
