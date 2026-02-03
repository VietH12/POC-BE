import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTranscriptAPI() {
    const apiUrl = 'https://darrick-colacobiotic-gazingly.ngrok-free.dev/extract_audio';

    console.log('🧪 Testing Transcript API...\n');

    // Check if test audio file exists
    const audioPath = path.join(__dirname, 'test-audio.webm');

    if (!fs.existsSync(audioPath)) {
        console.log('⚠️  Test audio file not found!');
        console.log('📝 Please create a test audio file:');
        console.log('   1. Record a short audio in browser');
        console.log('   2. Save as test-audio.webm in backend folder');
        console.log('   3. Run this script again\n');
        return;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));

    try {
        console.log('📤 Sending audio to API:', apiUrl);
        console.log('📁 File:', audioPath);
        console.log('📊 Size:', fs.statSync(audioPath).size, 'bytes\n');

        const response = await axios.post(apiUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 120000 // 2 minutes
        });

        console.log('✅ API Response Received!\n');
        console.log('📝 Response Type:', typeof response.data);
        console.log('📄 Response Data:');
        console.log(JSON.stringify(response.data, null, 2));

        // Try to parse if string
        if (typeof response.data === 'string') {
            try {
                const parsed = JSON.parse(response.data);
                console.log('\n✅ Parsed JSON:');
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('\n📝 Plain text response (not JSON)');
            }
        }

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('\n❌ Error calling transcript API:');
        console.error('Message:', error.message);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }

        if (error.code === 'ECONNABORTED') {
            console.error('⏱️  Request timeout - API took too long to respond');
        }

        console.log('\n💡 Troubleshooting:');
        console.log('   - Check if API URL is correct');
        console.log('   - Verify network connection');
        console.log('   - Try with a smaller audio file');
        console.log('   - Check API documentation for required format\n');
    }
}

console.log('═══════════════════════════════════════');
console.log('  Transcript API Test Script');
console.log('═══════════════════════════════════════\n');

testTranscriptAPI();
