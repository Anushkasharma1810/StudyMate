import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { parseDocumentFile, saveDocumentAndChunks } from '../services/documentService.js';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt', '.md'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.'));
    }
  }
});

// Upload document
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const userId = req.user?.id || 'user_demo_studymate_001';
    const subject = req.body.subject || 'General';
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = path.extname(originalName).replace('.', '').toUpperCase();

    const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Extract pages and text
    const extractedData = await parseDocumentFile(filePath, originalName, req.file.mimetype);

    // Save document and chunks to SQLite
    const saved = saveDocumentAndChunks(
      docId,
      userId,
      extractedData,
      originalName,
      fileType,
      fileSize,
      filePath,
      subject
    );

    res.status(201).json({
      success: true,
      document: {
        id: saved.id,
        title: saved.title,
        filename: originalName,
        fileType,
        fileSize,
        pageCount: saved.pageCount,
        wordCount: saved.wordCount,
        subject,
        summary: saved.summary
      }
    });
  } catch (err: any) {
    console.error('Upload processing error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: err.message || 'Failed to process document.' });
  }
});

// List all documents
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const search = req.query.search as string;
    const subject = req.query.subject as string;

    let query = `
      SELECT id, title, filename, file_type, file_size, page_count, word_count, subject,
             processing_status, summary, created_at
      FROM documents
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (search) {
      query += ` AND (title LIKE ? OR summary LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (subject && subject !== 'All') {
      query += ` AND subject = ?`;
      params.push(subject);
    }

    query += ` ORDER BY created_at DESC`;

    const docs = db.prepare(query).all(...params);
    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get document details & chunks
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const docId = req.params.id;

    const doc: any = db.prepare(`
      SELECT * FROM documents WHERE id = ? AND user_id = ?
    `).get(docId, userId);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const chunks = db.prepare(`
      SELECT id, page_number, chunk_index, content, heading
      FROM document_chunks
      WHERE document_id = ?
      ORDER BY page_number ASC, chunk_index ASC
    `).all(docId);

    res.json({
      document: doc,
      chunks
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete document
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const docId = req.params.id;

    const doc: any = db.prepare(`
      SELECT storage_path FROM documents WHERE id = ? AND user_id = ?
    `).get(docId, userId);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete physically if exists
    if (doc.storage_path && fs.existsSync(doc.storage_path)) {
      try {
        fs.unlinkSync(doc.storage_path);
      } catch (e) {
        console.warn('Could not delete physical file:', e);
      }
    }

    // SQLite cascade deletes chunks, notes reference set null or cascade
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
