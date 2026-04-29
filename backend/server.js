const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Controllers
const aiController = require('./controllers/aiController');

// Routes
app.post('/api/generate', aiController.generateContent);

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Course File Generator Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
