import express from 'express';
import { generatePDF, generateWord } from '../services/export.service.js';
import path from 'path';

const router = express.Router();

/**
 * POST /api/export/pdf
 * Generate PDF from transcript data
 */
router.post('/pdf', async (req, res) => {
    try {
        const { transcriptData, roomId } = req.body;

        if (!transcriptData) {
            return res.status(400).json({ success: false, error: 'Transcript data is required' });
        }

        const result = await generatePDF(transcriptData, roomId || 'unknown');

        // Send file
        res.download(result.filepath, result.filename, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
            }
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/export/word
 * Generate Word document from transcript data
 */
router.post('/word', async (req, res) => {
    try {
        const { transcriptData, roomId } = req.body;

        if (!transcriptData) {
            return res.status(400).json({ success: false, error: 'Transcript data is required' });
        }

        const result = await generateWord(transcriptData, roomId || 'unknown');

        // Send file
        res.download(result.filepath, result.filename, (err) => {
            if (err) {
                console.error('Error sending Word document:', err);
            }
        });

    } catch (error) {
        console.error('Error generating Word document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
