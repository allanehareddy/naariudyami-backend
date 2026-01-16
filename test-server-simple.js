// Simple test server without database
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running (without database)',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working! Install MongoDB to enable full functionality.',
    endpoints: 31,
    database: 'Not connected (install MongoDB)'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`✅ Visit: http://localhost:${PORT}/health`);
  console.log(`⚠️  Database not connected - install MongoDB to enable full features`);
});

