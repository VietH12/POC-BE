import express from 'express';
import { USERS, getUserById } from '../config/users.js';

const router = express.Router();

/**
 * GET /api/auth/users
 * Get all available users
 */
router.get('/users', (req, res) => {
    try {
        // Return users without sensitive data
        const publicUsers = USERS.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            avatar: user.avatar
        }));

        res.json({ success: true, users: publicUsers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/auth/select-user
 * Simple "login" by selecting a user
 */
router.post('/select-user', (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        const user = getUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // In a real app, you'd create a session/JWT token here
        // For simplicity, we just return the user data
        const token = `simple-token-${userId}-${Date.now()}`;

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                avatar: user.avatar
            },
            token
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
