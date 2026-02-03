import { AccessToken } from 'livekit-server-sdk';
import { livekitConfig } from '../config/livekit.js';

/**
 * Generate LiveKit access token for a user to join a room
 */
export const generateRoomToken = async (roomName, participantName, participantId) => {
    const at = new AccessToken(
        livekitConfig.apiKey,
        livekitConfig.apiSecret,
        {
            identity: participantId,
            name: participantName,
        }
    );

    // Grant permissions
    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });

    return await at.toJwt();
};

/**
 * Create room metadata
 */
export const createRoomMetadata = (roomId, creatorId, creatorName) => {
    return {
        roomId,
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: new Date().toISOString(),
        participants: [],
        maxParticipants: 5,
        isRecording: false,
        transcriptData: null
    };
};
