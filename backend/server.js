const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize the database connection and default records
require('./data/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Controllers and Services
const aiController = require('./controllers/aiController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const documentGenerator = require('./services/documentGenerator');

// --- Routes ---

// AI Generation Route
app.post('/api/generate', aiController.generateContent);

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/config', authController.getConfig);
app.post('/api/auth/google', authController.googleLogin);

// Admin Routes - Departments
app.get('/api/admin/departments', adminController.getDepartments);
app.post('/api/admin/departments', adminController.addDepartment);
app.delete('/api/admin/departments/:id', adminController.deleteDepartment);

// Admin Routes - Subjects
app.get('/api/admin/subjects', adminController.getSubjects);
app.post('/api/admin/subjects', adminController.addSubject);
app.delete('/api/admin/subjects/:id', adminController.deleteSubject);

// Admin Routes - Regulations
app.get('/api/admin/regulations', adminController.getRegulations);
app.post('/api/admin/regulations', adminController.addRegulation);

// Admin Routes - Audits & Analytics
app.get('/api/admin/generations', adminController.getGenerations);
app.get('/api/admin/stats', adminController.getStats);

// Template Document Export Route
app.post('/api/export', (req, res) => {
  try {
    const payload = req.body;
    console.log(`Received export request for ${payload.subjectCode} (${payload.type})`);
    
    const result = documentGenerator.generateDocument(payload);
    
    // Set appropriate headers based on whether it is fallback HTML-Word (.doc) or real DOCX (.docx)
    const contentType = result.isFallback 
      ? 'application/msword' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    
    res.status(200).send(result.buffer);
  } catch (error) {
    console.error('API Export error:', error);
    res.status(500).json({ error: 'Failed to compile formatted document', details: error.message });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Course File Generator Backend is running with dynamic databases' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
