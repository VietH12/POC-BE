import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateRoomToken, createRoomMetadata } from '../services/livekit.service.js';
import { createRoomIdFromUser } from '../utils/slug.js';
// DEPRECATED: recording.service imports - not used anymore
// import { startRecording, stopRecording, saveAudioFile, processTranscript, cleanupRecording } from '../services/recording.service.js';

const router = express.Router();

// In-memory room storage
const rooms = new Map();

/**
 * POST /api/rooms/create
 * Create a new room
 */
router.post('/create', async (req, res) => {
    try {
        const { userId, userName } = req.body;

        if (!userId || !userName) {
            return res.status(400).json({ success: false, error: 'User ID and name are required' });
        }

        // Create user-friendly room ID from user name
        const existingRoomIds = Array.from(rooms.keys());
        const roomId = createRoomIdFromUser(userName, existingRoomIds);
        const roomName = `room-${roomId}`;

        // Create room metadata
        const roomData = createRoomMetadata(roomId, userId, userName);
        roomData.createdBy = userName; // Store creator name for lookup
        rooms.set(roomId, roomData);

        // Generate token for creator
        const token = await generateRoomToken(roomName, userName, userId);

        console.log(`🔑 Generated token for ${userName}:`, typeof token, token.substring(0, 50) + '...');

        // Start recording (deprecated but keeping for now)
        // startRecording(roomId);

        console.log(`🏠 Room created: ${roomId} (${userName})`);

        res.json({
            success: true,
            room: {
                roomId,
                roomName,
                token,
                livekitUrl: process.env.LIVEKIT_URL
            }
        });

    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/rooms/join
 * Join an existing room
 */
router.post('/join', async (req, res) => {
    try {
        const { roomId, userId, userName } = req.body;

        if (!roomId || !userId || !userName) {
            return res.status(400).json({ success: false, error: 'Room ID, user ID, and name are required' });
        }

        const room = rooms.get(roomId);

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // Check if room is full
        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({ success: false, error: 'Room is full (max 5 participants)' });
        }

        // Add participant
        if (!room.participants.find(p => p.userId === userId)) {
            room.participants.push({ userId, userName, joinedAt: new Date() });
        }

        const roomName = `room-${roomId}`;
        const token = await generateRoomToken(roomName, userName, userId);

        console.log(`👤 ${userName} joined room: ${roomId}`);

        res.json({
            success: true,
            room: {
                roomId,
                roomName,
                token,
                livekitUrl: process.env.LIVEKIT_URL,
                participants: room.participants
            }
        });

    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/rooms/:roomId/leave
 * Leave a room
 */
router.post('/:roomId/leave', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body;

        const room = rooms.get(roomId);

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // Remove participant
        room.participants = room.participants.filter(p => p.userId !== userId);

        console.log(`👋 User ${userId} left room: ${roomId}`);

        res.json({ success: true, message: 'Left room successfully' });

    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/rooms/:roomId/end
 * End a meeting and process recording
 */
router.post('/:roomId/end', async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log(`🏁 Attempting to end meeting for room: ${roomId}`);

        const room = rooms.get(roomId);

        if (!room) {
            console.log(`❌ Room not found: ${roomId}`);
            console.log(`📋 Available rooms:`, Array.from(rooms.keys()));
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // Stop recording
        const recordingResult = await stopRecording(roomId);

        console.log(`✅ Meeting ended successfully for room: ${roomId}`);

        // Clean up room
        rooms.delete(roomId);

        res.json({
            success: true,
            message: 'Meeting ended successfully',
            recording: recordingResult
        });

    } catch (error) {
        console.error('Error ending meeting:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// DEPRECATED: Old backend audio upload flow
// Frontend now uploads directly to Gemini API
// Keeping this code commented for reference
// ========================================

/*
router.post('/:roomId/upload-audio', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { audioBlob } = req.body;

        if (!audioBlob) {
            return res.status(400).json({ success: false, error: 'Audio data is required' });
        }

        console.log(`📤 Processing audio for room: ${roomId}`);

        // Save audio file
        const audioPath = await saveAudioFile(audioBlob, roomId);

        // Send to transcript API
        const transcriptData = await processTranscript(audioPath);

        // Store transcript in room data (if room still exists)
        const room = rooms.get(roomId);
        if (room) {
            room.transcriptData = transcriptData;
        }

        // Clean up audio file
        cleanupRecording(audioPath);

        res.json({
            success: true,
            transcript: transcriptData
        });

    } catch (error) {
        console.error('Error processing audio:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
*/

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        const room = rooms.get(roomId);

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        res.json({ success: true, room });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
