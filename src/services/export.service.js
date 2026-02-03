import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF from transcript data
 */
export const generatePDF = async (transcriptData, roomId) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const exportsDir = path.join(__dirname, '../../exports');

            if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
            }

            const filename = `bien_ban_${roomId}_${Date.now()}.pdf`;
            const filepath = path.join(exportsDir, filename);
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Title
            doc.fontSize(20).font('Helvetica-Bold').text('BIÊN BẢN HỘI CHẨN', { align: 'center' });
            doc.moveDown(2);

            // Section 1: Thông tin hội chẩn
            doc.fontSize(14).font('Helvetica-Bold').text('I. THÔNG TIN HỘI CHẨN');
            doc.moveDown(0.5);

            const info = transcriptData.THONG_TIN_HOI_CHAN || {};
            doc.fontSize(11).font('Helvetica');
            doc.text(`Ngày hội chẩn: ${info.ngayHoiChan || 'N/A'}`);
            doc.text(`Cấp hội chẩn: ${info.capHoiChan || 'N/A'}`);
            doc.text(`Chủ trì: ${info.chuTri || 'N/A'}`);
            doc.text(`Thư ký: ${info.thuKy || 'N/A'}`);
            doc.text(`Tiên lượng: ${info.tienLuong || 'N/A'}`);
            doc.moveDown(2);

            // Section 2: Nội dung chuyên môn
            doc.fontSize(14).font('Helvetica-Bold').text('II. NỘI DUNG CHUYÊN MÔN');
            doc.moveDown(0.5);

            const content = transcriptData.NOI_DUNG_CHUYEN_MON || {};
            doc.fontSize(11).font('Helvetica');

            doc.font('Helvetica-Bold').text('1. Lâm sàng:');
            doc.font('Helvetica').text(content.lamSang || 'N/A', { indent: 20 });
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('2. Tóm tắt cận lâm sàng:');
            doc.font('Helvetica').text(content.tomTatCanLamSang || 'N/A', { indent: 20 });
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('3. Chẩn đoán:');
            doc.font('Helvetica').text(content.chanDoan || 'N/A', { indent: 20 });
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('4. Chẩn đoán kèm theo:');
            doc.font('Helvetica').text(content.chanDoanKemTheo || 'N/A', { indent: 20 });
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('5. Kết luận:');
            doc.font('Helvetica').text(content.ketLuan || 'N/A', { indent: 20 });
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('6. Hướng điều trị:');
            doc.font('Helvetica').text(content.huongDieuTri || 'N/A', { indent: 20 });
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('7. Chỉ định xét nghiệm:');
            doc.font('Helvetica').text(content.chiDinhXetNghiem || 'N/A', { indent: 20 });

            doc.end();

            stream.on('finish', () => {
                console.log(`📄 PDF generated: ${filepath}`);
                resolve({ filepath, filename });
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Word document from transcript data
 */
export const generateWord = async (transcriptData, roomId) => {
    try {
        const info = transcriptData.THONG_TIN_HOI_CHAN || {};
        const content = transcriptData.NOI_DUNG_CHUYEN_MON || {};

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Title
                    new Paragraph({
                        text: 'BIÊN BẢN HỘI CHẨN',
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Section 1: Thông tin hội chẩn
                    new Paragraph({
                        text: 'I. THÔNG TIN HỘI CHẨN',
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Ngày hội chẩn: ', bold: true }),
                            new TextRun(info.ngayHoiChan || 'N/A')
                        ]
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Cấp hội chẩn: ', bold: true }),
                            new TextRun(info.capHoiChan || 'N/A')
                        ]
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Chủ trì: ', bold: true }),
                            new TextRun(info.chuTri || 'N/A')
                        ]
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Thư ký: ', bold: true }),
                            new TextRun(info.thuKy || 'N/A')
                        ]
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Tiên lượng: ', bold: true }),
                            new TextRun(info.tienLuong || 'N/A')
                        ],
                        spacing: { after: 400 }
                    }),

                    // Section 2: Nội dung chuyên môn
                    new Paragraph({
                        text: 'II. NỘI DUNG CHUYÊN MÔN',
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '1. Lâm sàng:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.lamSang || 'N/A',
                        indent: { left: 720 },
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '2. Tóm tắt cận lâm sàng:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.tomTatCanLamSang || 'N/A',
                        indent: { left: 720 },
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '3. Chẩn đoán:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.chanDoan || 'N/A',
                        indent: { left: 720 },
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '4. Chẩn đoán kèm theo:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.chanDoanKemTheo || 'N/A',
                        indent: { left: 720 },
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '5. Kết luận:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.ketLuan || 'N/A',
                        indent: { left: 720 },
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '6. Hướng điều trị:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.huongDieuTri || 'N/A',
                        indent: { left: 720 },
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '7. Chỉ định xét nghiệm:', bold: true })
                        ]
                    }),
                    new Paragraph({
                        text: content.chiDinhXetNghiem || 'N/A',
                        indent: { left: 720 }
                    })
                ]
            }]
        });

        const exportsDir = path.join(__dirname, '../../exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        const filename = `bien_ban_${roomId}_${Date.now()}.docx`;
        const filepath = path.join(exportsDir, filename);

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filepath, buffer);

        console.log(`📝 Word document generated: ${filepath}`);
        return { filepath, filename };

    } catch (error) {
        console.error('Error generating Word document:', error);
        throw error;
    }
};
