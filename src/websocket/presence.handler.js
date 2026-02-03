import {
    updateUserStatus,
    setUserSocket,
    getUserBySocketId,
    getAllUsers
} from '../config/users.js';

/**
 * Setup WebSocket handlers for real-time presence
 */
export const setupPresenceHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // User connects with their ID
        socket.on('user:connect', (userId) => {
            try {
                // Update user status to online
                const user = updateUserStatus(userId, 'online');
                setUserSocket(userId, socket.id);

                console.log(`✅ User ${user.name} is now online`);

                // Broadcast to all clients
                io.emit('users:update', getAllUsers());

                // Send current user list to the connecting user
                socket.emit('users:list', getAllUsers());

            } catch (error) {
                console.error('Error handling user connect:', error);
            }
        });

        // User joins a room
        socket.on('room:join', ({ userId, roomId }) => {
            try {
                const user = updateUserStatus(userId, 'in-meeting', roomId);
                socket.join(roomId);

                console.log(`🏠 User ${user.name} joined room ${roomId}`);

                // Broadcast updated user list
                io.emit('users:update', getAllUsers());

                // Notify room participants
                io.to(roomId).emit('room:user-joined', { userId, userName: user.name });

            } catch (error) {
                console.error('Error handling room join:', error);
            }
        });

        // User leaves a room
        socket.on('room:leave', ({ userId, roomId }) => {
            try {
                const user = updateUserStatus(userId, 'online', null);
                socket.leave(roomId);

                console.log(`👋 User ${user.name} left room ${roomId}`);

                // Broadcast updated user list
                io.emit('users:update', getAllUsers());

                // Notify room participants
                io.to(roomId).emit('room:user-left', { userId, userName: user.name });

            } catch (error) {
                console.error('Error handling room leave:', error);
            }
        });

        // Meeting ended - send transcript to all participants
        socket.on('meeting:ended', ({ roomId, transcript }) => {
            try {
                console.log(`📋 Broadcasting transcript for room ${roomId}`);

                // Send transcript to all participants in the room
                io.to(roomId).emit('transcript:received', transcript);

            } catch (error) {
                console.error('Error broadcasting transcript:', error);
            }
        });

        // User disconnects
        socket.on('disconnect', () => {
            try {
                const user = getUserBySocketId(socket.id);

                if (user) {
                    updateUserStatus(user.id, 'offline', null);
                    setUserSocket(user.id, null);

                    console.log(`❌ User ${user.name} disconnected`);

                    // Broadcast updated user list
                    io.emit('users:update', getAllUsers());
                }

            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    });
};
