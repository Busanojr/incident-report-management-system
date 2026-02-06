
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');

const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const incidentRoutes = require('./routes/incidents');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || 'http://localhost:8080',  
        'http://localhost:5500',
        'http://127.0.0.1:5500'                             
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/incidents', incidentRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const startServer = async () => {
    try {
        
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }
        
        app.listen(PORT, () => {
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║  Incident Report Management System - Backend      ║');
            console.log('╠════════════════════════════════════════════════════╣');
            console.log(`║  Server running on port ${PORT}                       ║`);
            console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}                       ║`);
            console.log(`║  Database: Connected                               ║`);
            console.log('╚════════════════════════════════════════════════════╝');
            console.log('');
            console.log('API Endpoints:');
            console.log(`  - Health Check:      http://localhost:${PORT}/health`);
            console.log(`  - User Registration: POST http://localhost:${PORT}/api/users/register`);
            console.log(`  - User Login:        POST http://localhost:${PORT}/api/users/login`);
            console.log(`  - Admin Login:       POST http://localhost:${PORT}/api/admin/login`);
            console.log(`  - Create Incident:   POST http://localhost:${PORT}/api/incidents`);
            console.log(`  - Get Incidents:     GET  http://localhost:${PORT}/api/incidents`);
            console.log('');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

startServer();

module.exports = app;