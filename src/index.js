import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import exportRoutes from './routes/export.routes.js';
import { setupPresenceHandlers } from './websocket/presence.handler.js';
import { validateLivekitConfig } from './config/livekit.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from same network and production
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'https://localhost:3000',
            // LAN networks
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
            /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/,
            // Zeabur domains (HTTPS)
            /^https:\/\/.*\.zeabur\.app$/,
            // Vercel domains (HTTPS)
            /^https:\/\/.*\.vercel\.app$/,
            // Railway domains (HTTPS)
            /^https:\/\/.*\.railway\.app$/,
        ];

        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production' && !origin) {
            callback(null, true);
            return;
        }

        if (!origin || allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') return allowed === origin;
            return allowed.test(origin);
        })) {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Medical Video Backend is running' });
});

// Setup Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            const allowedOrigins = [
                process.env.FRONTEND_URL,
                'http://localhost:3000',
                'https://localhost:3000',
                /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
                /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
                /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/,
                /^https:\/\/.*\.zeabur\.app$/,
                /^https:\/\/.*\.vercel\.app$/,
                /^https:\/\/.*\.railway\.app$/,
            ];

            if (process.env.NODE_ENV !== 'production' && !origin) {
                callback(null, true);
                return;
            }

            if (!origin || allowedOrigins.some(allowed => {
                if (typeof allowed === 'string') return allowed === origin;
                return allowed.test(origin);
            })) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    },
    maxHttpBufferSize: 50 * 1024 * 1024 // 50MB for audio uploads
});

// Setup WebSocket handlers
setupPresenceHandlers(io);

// Validate configuration
const PORT = process.env.PORT || 3001;

console.log('\n🏥 Medical Video Consultation System - Backend\n');

if (!validateLivekitConfig()) {
    console.error('\n⚠️  WARNING: LiveKit not configured properly!');
    console.error('Please update your .env file with LiveKit credentials.\n');
}

// Start server
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for cloud deployment
httpServer.listen(PORT, HOST, () => {
    console.log(`\n✅ Server running on ${HOST}:${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌐 API: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

    httpServer.close(() => {
        console.log('✅ HTTP server closed');

        io.close(() => {
            console.log('✅ WebSocket server closed');
            console.log('👋 Shutdown complete\n');
            process.exit(0);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { io };
