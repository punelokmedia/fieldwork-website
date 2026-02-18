# Field Work & Social Publishing App

## Overview
A full-stack MERN application for field data collection, reporting, and social media publishing. Designed for news agencies or field research teams.

## Features
- **User Roles**: Admin, Manager, Field Reporter.
- **Data Collection**: Geo-tagged reports with photo/video support.
- **Media Editor**: Built-in image editor (filters, brightness, watermark).
- **Dashboard**: Interactive table view of reports.
- **Social Integration**: Publish directly to social platforms (Interface).

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB.
- **Auth**: JWT, BCrypt.
- **Storage**: Local/Multer (Configurable for Cloudinary).

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (running locally or URI)

### 1-Click Setup
1. **Server Setup**:
   ```bash
   cd server
   npm install
   # Create a .env file with MONGO_URI, JWT_SECRET, PORT
   npm start
   ```

2. **Client Setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Login**:
   - Register a new user via the UI.
   - Or use seed data (if applicable).

## Project Structure
- `/server/models` - Mongoose schemas (User, Report).
- `/server/routes` - API endpoints.
- `/client/src/pages` - Main views (Login, Dashboard).
- `/client/src/components` - Reusable UI (MediaEditor, SocialShare).
- `/client/src/context` - Auth State Management.

## Future Roadmap
- Integration with real Social Media APIs (Graph API, Twitter API).
- Cloudinary Integration for scalable storage.
- FFmpeg server-side video processing.
