import dotenv from 'dotenv';

dotenv.config();

export const livekitConfig = {
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    url: process.env.LIVEKIT_URL
};

// Validate LiveKit configuration
export const validateLivekitConfig = () => {
    const { apiKey, apiSecret, url } = livekitConfig;

    if (!apiKey || !apiSecret || !url) {
        console.error('❌ LiveKit configuration missing!');
        console.error('Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in .env file');
        console.error('Get your credentials from: https://cloud.livekit.io/projects');
        return false;
    }

    console.log('✅ LiveKit configuration loaded');
    return true;
};
