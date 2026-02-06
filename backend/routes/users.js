
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { generateToken, verifyToken } = require('../middleware/auth');


router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }
        
        const existingUser = await query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await query(
            'INSERT INTO users (username, email, password_hash, ip_address) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, ipAddress]
        );
        
        const token = generateToken({
            id: result.insertId,
            username,
            isAdmin: false
        });
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        const users = await query(
            'SELECT id, username, email, password_hash, is_flagged, false_report_count FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const user = users[0];
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        await query(
            'UPDATE users SET last_login = NOW(), ip_address = ? WHERE id = ?',
            [ipAddress, user.id]
        );
        
        const token = generateToken({
            id: user.id,
            username: user.username,
            isAdmin: false
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isFlagged: user.is_flagged,
                falseReportCount: user.false_report_count
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});


router.get('/profile', verifyToken, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, username, email, ip_address, false_report_count, is_flagged, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

module.exports = router;