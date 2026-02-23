require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(compression());
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Validate Social Media Tokens
const validateTokens = require('./utils/tokenValidator');
validateTokens();

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
