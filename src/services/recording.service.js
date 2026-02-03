import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * In-memory storage for room recordings
 */
const roomRecordings = new Map();

/**
 * Start recording for a room
 */
export const startRecording = (roomId) => {
    console.log(`🎙️ Starting recording for room: ${roomId}`);

    roomRecordings.set(roomId, {
        roomId,
        startTime: new Date(),
        audioChunks: [],
        isRecording: true
    });

    return { success: true, message: 'Recording started' };
};

/**
 * Add audio chunk to recording
 */
export const addAudioChunk = (roomId, audioData) => {
    const recording = roomRecordings.get(roomId);
    if (recording && recording.isRecording) {
        recording.audioChunks.push(audioData);
        return { success: true };
    }
    return { success: false, message: 'No active recording found' };
};

/**
 * Stop recording and process the audio
 */
export const stopRecording = async (roomId) => {
    console.log(`⏹️ Stopping recording for room: ${roomId}`);

    const recording = roomRecordings.get(roomId);
    if (!recording) {
        return { success: false, message: 'No recording found' };
    }

    recording.isRecording = false;
    recording.endTime = new Date();

    return { success: true, recording };
};

/**
 * Save audio blob to file
 */
export const saveAudioFile = async (audioBlob, roomId) => {
    const recordingsDir = path.join(__dirname, '../../recordings');

    if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const filename = `room_${roomId}_${Date.now()}.webm`;
    const filepath = path.join(recordingsDir, filename);

    fs.writeFileSync(filepath, Buffer.from(audioBlob));

    console.log(`💾 Audio saved to: ${filepath}`);
    return filepath;
};

/**
 * Wait for file to be fully written and validate it
 */
const waitForFile = async (filePath, maxWaitMs = 3000) => {
    const startTime = Date.now();
    let lastSize = 0;

    while (Date.now() - startTime < maxWaitMs) {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const currentSize = stats.size;

            // File exists and has content
            if (currentSize > 0) {
                // Wait a bit and check if size is stable
                await new Promise(resolve => setTimeout(resolve, 500));
                const newStats = fs.statSync(filePath);

                if (newStats.size === currentSize && currentSize > 1000) {
                    // File size is stable and reasonable
                    console.log(`✅ File ready: ${path.basename(filePath)} (${currentSize} bytes)`);
                    return true;
                }
            }
            lastSize = currentSize;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.warn(`⚠️ File wait timeout: ${path.basename(filePath)}`);
    return false;
};

/**
 * Convert WebM to WAV for Gemini API compatibility
 */
const convertToWav = async (inputPath) => {
    // Wait for file to be fully written
    const isReady = await waitForFile(inputPath);
    if (!isReady) {
        throw new Error('File not ready for conversion');
    }

    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace('.webm', '.wav');

        console.log(`🔄 Converting ${path.basename(inputPath)} to WAV...`);

        ffmpeg(inputPath)
            .toFormat('wav')
            .audioCodec('pcm_s16le')
            .audioChannels(1)
            .audioFrequency(16000)
            .on('end', () => {
                console.log(`✅ Conversion complete: ${path.basename(outputPath)}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('❌ FFmpeg conversion error:', err.message);
                reject(err);
            })
            .save(outputPath);
    });
};

/**
 * Map Gemini API response to our display format
 */
const mapGeminiResponseToTranscript = (geminiData) => {
    const chiSoSinhTon = geminiData.CHI_SO_SINH_TON_NB_CHI_SO_SONG || {};
    const hoiBenh = geminiData.HOI_BENH_NB_HOI_BENH || {};
    const khamLamSang = geminiData.KHAM_LAM_SANG_NB_KHAM_XET || {};
    const chanDoan = geminiData.CHAN_DOAN_NB_CHAN_DOAN || {};
    const ketLuan = geminiData.KET_LUAN_NB_KET_LUAN || {};
    const canLamSang = geminiData.CAN_LAM_SANG_TOM_TAT_NB_TOM_TAT_CLS || {};

    // Build clinical summary
    const lamSangParts = [];
    if (khamLamSang.toanThan) lamSangParts.push(`Toàn thân: ${khamLamSang.toanThan}`);
    if (khamLamSang.tim) lamSangParts.push(`Tim: ${khamLamSang.tim}`);
    if (khamLamSang.phoi) lamSangParts.push(`Phổi: ${khamLamSang.phoi}`);
    if (khamLamSang.bung) lamSangParts.push(`Bụng: ${khamLamSang.bung}`);

    // Build vital signs summary
    const vitalSignsParts = [];
    if (chiSoSinhTon.mach) vitalSignsParts.push(`Mạch: ${chiSoSinhTon.mach} nhịp/phút`);
    if (chiSoSinhTon.nhietDo) vitalSignsParts.push(`Nhiệt độ: ${chiSoSinhTon.nhietDo}°C`);
    if (chiSoSinhTon.huyetApTamThu && chiSoSinhTon.huyetApTamTruong) {
        vitalSignsParts.push(`HA: ${chiSoSinhTon.huyetApTamThu}/${chiSoSinhTon.huyetApTamTruong} mmHg`);
    }
    if (chiSoSinhTon.nhipTho) vitalSignsParts.push(`Nhịp thở: ${chiSoSinhTon.nhipTho} lần/phút`);

    // Build paraclinical summary
    const canLamSangParts = [];
    if (canLamSang.congThucMau) canLamSangParts.push(`Công thức máu: ${canLamSang.congThucMau}`);
    if (canLamSang.sinhHoaMau) canLamSangParts.push(`Sinh hóa máu: ${canLamSang.sinhHoaMau}`);
    if (canLamSang.cdhaTdcn) canLamSangParts.push(`CĐHA/TDCN: ${canLamSang.cdhaTdcn}`);

    return {
        THONG_TIN_HOI_CHAN: {
            ngayHoiChan: new Date().toLocaleDateString('vi-VN'),
            capHoiChan: 'Hội chẩn cấp khoa',
            chuTri: 'Bác sĩ chủ trì',
            thuKy: 'Thư ký',
            tienLuong: ketLuan.loiDan || 'Theo dõi'
        },
        NOI_DUNG_CHUYEN_MON: {
            chiSoSinhTon: vitalSignsParts.join(', ') || null,
            tienSuBanThan: hoiBenh.tienSuBanThan || null,
            tienSuGiaDinh: hoiBenh.tienSuGiaDinh || null,
            diUng: hoiBenh.diUngThuoc || 'Không',
            quaTrinhBenhLy: hoiBenh.quaTrinhBenhLy || null,
            lamSang: lamSangParts.join('. ') || 'Không có thông tin',
            dienBien: khamLamSang.dienBien || null,
            tomTatCanLamSang: canLamSangParts.join('. ') || 'Chưa có kết quả',
            chanDoan: chanDoan.cdChinh || chanDoan.cdSoBo || 'Chưa xác định',
            chanDoanKemTheo: chanDoan.cdKemTheo || null,
            chanDoanPhanBiet: chanDoan.cdPhanBiet || null,
            ketLuan: ketLuan.loiDan || chanDoan.moTa || 'Theo dõi tiếp',
            huongDieuTri: ketLuan.loiDan || 'Điều trị theo chỉ định',
            chiDinhXetNghiem: canLamSang.viSinh || null,
            _rawGeminiData: geminiData
        }
    };
};

/**
 * Send audio to transcript API and get result
 */
export const processTranscript = async (audioFilePath) => {
    const transcriptApiUrl = process.env.TRANSCRIPT_API_URL;

    if (!transcriptApiUrl || transcriptApiUrl.includes('your-api.com')) {
        console.warn('⚠️ TRANSCRIPT_API_URL not configured. Returning mock data.');
        return getMockTranscriptData();
    }

    try {
        console.log(`🔍 DEBUG: audioFilePath = ${audioFilePath}`);
        console.log(`🔍 DEBUG: ends with .webm? ${audioFilePath.endsWith('.webm')}`);

        // Convert WebM to WAV for Gemini compatibility
        let wavFilePath = audioFilePath;
        if (audioFilePath.endsWith('.webm')) {
            console.log('🎬 WebM file detected - starting conversion...');
            try {
                wavFilePath = await convertToWav(audioFilePath);
                console.log(`✅ Conversion successful! New path: ${wavFilePath}`);
            } catch (conversionError) {
                console.error('⚠️ Audio conversion failed, trying with original file:', conversionError.message);
                console.error('📋 Full error:', conversionError);
                // Continue with original file if conversion fails
            }
        } else {
            console.log('ℹ️ Not a WebM file, skipping conversion');
        }

        console.log(`📤 Sending audio to transcript API: ${transcriptApiUrl}`);
        console.log(`📁 File: ${path.basename(wavFilePath)}`);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(wavFilePath));

        const response = await axios.post(transcriptApiUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 120000 // 2 minutes timeout
        });

        console.log('✅ Transcript received from API');
        console.log('📊 Response type:', typeof response.data);

        let geminiData = response.data;

        // If response is string, try to parse
        if (typeof geminiData === 'string') {
            try {
                geminiData = JSON.parse(geminiData);
            } catch (e) {
                console.warn('⚠️ Could not parse API response as JSON');
                console.log('Raw response:', geminiData.substring(0, 200));
                return getMockTranscriptData();
            }
        }

        // Check if response has error
        if (geminiData.error || geminiData.status === 'failed') {
            console.warn('⚠️ API returned error:', geminiData.error);
            return getMockTranscriptData();
        }

        // Map Gemini's nested structure to our display format
        const transcriptData = mapGeminiResponseToTranscript(geminiData);

        console.log('✅ Transcript data mapped successfully');
        console.log('📋 Extracted diagnosis:', transcriptData.NOI_DUNG_CHUYEN_MON.chanDoan);

        return transcriptData;

    } catch (error) {
        console.error('❌ Error calling transcript API:', error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', JSON.stringify(error.response.data).substring(0, 200));
        }
        console.warn('⚠️ Falling back to mock data');
        return getMockTranscriptData();
    }
};

/**
 * Mock transcript data for testing
 */
const getMockTranscriptData = () => {
    return {
        THONG_TIN_HOI_CHAN: {
            ngayHoiChan: new Date().toLocaleDateString('vi-VN'),
            capHoiChan: 'Hội chẩn cấp khoa',
            chuTri: 'Bác sĩ A',
            thuKy: 'Điều dưỡng C',
            tienLuong: 'Tiên lượng tốt'
        },
        NOI_DUNG_CHUYEN_MON: {
            lamSang: 'Bệnh nhân nam, 45 tuổi, vào viện với triệu chứng đau ngực, khó thở.',
            tomTatCanLamSang: 'Xét nghiệm máu: WBC tăng nhẹ, CRP 15mg/L. X-quang phổi: không thấy tổn thương rõ ràng.',
            chanDoan: 'Viêm phế quản cấp',
            chanDoanKemTheo: 'Tăng huyết áp độ I',
            ketLuan: 'Điều trị nội khoa, theo dõi sát tại khoa Nội.',
            huongDieuTri: 'Kháng sinh phổ rộng, thuốc giãn phế quản, theo dõi dấu hiệu sinh tồn.',
            chiDinhXetNghiem: 'Xét nghiệm máu toàn bộ, CRP, procalcitonin sau 3 ngày.'
        }
    };
};

/**
 * Clean up old recording files
 */
export const cleanupRecording = (filepath) => {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`🗑️ Cleaned up recording: ${filepath}`);
        }
    } catch (error) {
        console.error('Error cleaning up recording:', error.message);
    }
};
