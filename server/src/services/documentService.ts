import fs from 'fs';
import path from 'path';
import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
import { db } from '../db/database.js';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  title: string;
  pageCount: number;
  wordCount: number;
  pages: ExtractedPage[];
  fullText: string;
}

export async function parseDocumentFile(filePath: string, originalName: string, mimeType: string): Promise<ExtractedDocument> {
  const ext = path.extname(originalName).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  let pages: ExtractedPage[] = [];
  let fullText = '';
  let pageCount = 1;

  if (ext === '.pdf') {
    // pdf-parse v2 API utilizes the PDFParse class
    const PDFParserClass = (pdfParseModule as any).PDFParse || 
      (pdfParseModule as any).default?.PDFParse || 
      (pdfParseModule as any).default;

    if (!PDFParserClass) {
      throw new Error('PDF parsing engine could not be initialized.');
    }

    try {
      if (typeof PDFParserClass === 'function' && PDFParserClass.prototype?.getText) {
        // v2 Class-based parsing
        const parser = new PDFParserClass({ data: fileBuffer });
        try {
          const result = await parser.getText();
          pageCount = result.total || (result.pages && result.pages.length) || 1;

          if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
            pages = result.pages.map((p: any) => ({
              pageNumber: Number(p.num) || 1,
              text: (p.text || '').trim()
            })).filter((p: ExtractedPage) => p.text.length > 0);
          }

          if (pages.length === 0 && result.text) {
            pages = [{ pageNumber: 1, text: result.text.trim() }];
          }

          fullText = pages.map(p => p.text).join('\n\n') || (result.text || '').trim();
        } finally {
          if (typeof parser.destroy === 'function') {
            await parser.destroy().catch(() => {});
          }
        }
      } else if (typeof PDFParserClass === 'function') {
        // v1 function-style fallback if ever downgraded
        const data = await (PDFParserClass as any)(fileBuffer);
        pageCount = data.numpages || 1;
        pages = [{ pageNumber: 1, text: (data.text || '').trim() }];
        fullText = (data.text || '').trim();
      } else {
        throw new Error('Unsupported PDF parser export signature.');
      }
    } catch (err: any) {
      console.error('PDF parsing error encountered:', err);
      const errMsg = (err?.message || '').toLowerCase();
      const errName = (err?.name || '');

      if (
        err instanceof (pdfParseModule as any).PasswordException ||
        errName === 'PasswordException' ||
        errMsg.includes('password')
      ) {
        throw new Error('This PDF is password-protected. Please remove the password and re-upload.');
      }

      if (
        err instanceof (pdfParseModule as any).InvalidPDFException ||
        err instanceof (pdfParseModule as any).FormatError ||
        errMsg.includes('invalid pdf') ||
        errMsg.includes('format') ||
        errMsg.includes('corrupted')
      ) {
        throw new Error('The PDF file is corrupted or formatted improperly. Please verify the document and try again.');
      }

      throw new Error(`Failed to extract text from PDF: ${err.message || 'Corrupted or unsupported PDF'}`);
    }
  } else if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      fullText = result.value.trim();
      // Estimate pages for docx (~400 words per page)
      const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const wordsPerPage = 400;
      let currentPage = 1;
      let currentWords = 0;
      let currentText = '';

      for (const p of paragraphs) {
        const wordsInP = p.split(/\s+/).length;
        if (currentWords + wordsInP > wordsPerPage && currentText) {
          pages.push({ pageNumber: currentPage, text: currentText.trim() });
          currentPage++;
          currentText = p + '\n\n';
          currentWords = wordsInP;
        } else {
          currentText += p + '\n\n';
          currentWords += wordsInP;
        }
      }
      if (currentText) {
        pages.push({ pageNumber: currentPage, text: currentText.trim() });
      }
      pageCount = Math.max(1, pages.length);
    } catch (err: any) {
      throw new Error(`Failed to extract text from DOCX: ${err.message}`);
    }
  } else if (ext === '.txt' || ext === '.md') {
    fullText = fileBuffer.toString('utf-8').trim();
    // Chunk into ~400 word simulated pages
    const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let currentPage = 1;
    let currentWords = 0;
    let currentText = '';

    for (const p of paragraphs) {
      const wordsInP = p.split(/\s+/).length;
      if (currentWords + wordsInP > 400 && currentText) {
        pages.push({ pageNumber: currentPage, text: currentText.trim() });
        currentPage++;
        currentText = p + '\n\n';
        currentWords = wordsInP;
      } else {
        currentText += p + '\n\n';
        currentWords += wordsInP;
      }
    }
    if (currentText) {
      pages.push({ pageNumber: currentPage, text: currentText.trim() });
    }
    pageCount = Math.max(1, pages.length);
  } else {
    throw new Error(`Unsupported file format '${ext}'. Please upload a PDF, DOCX, or TXT file.`);
  }

  if (!fullText || fullText.trim().length === 0) {
    throw new Error('No readable text could be extracted from this document. It may be an image-only scan or empty. OCR for scanned PDFs is not currently supported; please upload a text-based PDF or document.');
  }

  const wordCount = fullText.trim().split(/\s+/).length;
  const cleanTitle = path.basename(originalName, path.extname(originalName))
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: cleanTitle,
    pageCount,
    wordCount,
    pages,
    fullText
  };
}

export function saveDocumentAndChunks(
  docId: string,
  userId: string,
  docData: ExtractedDocument,
  filename: string,
  fileType: string,
  fileSize: number,
  storagePath: string,
  subject: string = 'General'
) {
  // Generate brief automatic summary preview (first 2-3 key sentences)
  const initialSentences = docData.fullText
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+/g) || [docData.fullText.slice(0, 200)];
  const autoSummary = initialSentences.slice(0, 3).join(' ').trim();

  const insertDoc = db.prepare(`
    INSERT INTO documents (
      id, user_id, title, filename, file_type, file_size, page_count, word_count,
      subject, processing_status, storage_path, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?)
  `);

  insertDoc.run(
    docId,
    userId,
    docData.title,
    filename,
    fileType,
    fileSize,
    docData.pageCount,
    docData.wordCount,
    subject,
    storagePath,
    autoSummary
  );

  const insertChunk = db.prepare(`
    INSERT INTO document_chunks (
      id, document_id, page_number, chunk_index, content, heading
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert chunks per page, sub-chunking if a single page exceeds 600 words
  let globalChunkIndex = 0;
  for (const page of docData.pages) {
    const text = page.text.trim();
    if (!text) continue;

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let chunkBuffer = '';
    let firstHeading = '';

    for (const p of paragraphs) {
      if (!firstHeading && (p.length < 80 && (p.startsWith('#') || /^[A-Z0-9\s:.-]+$/.test(p.trim())))) {
        firstHeading = p.trim().replace(/^#+\s*/, '');
      }

      if ((chunkBuffer + '\n\n' + p).split(/\s+/).length > 600 && chunkBuffer) {
        const chunkId = `chk_${docId}_${globalChunkIndex++}`;
        insertChunk.run(chunkId, docId, page.pageNumber, globalChunkIndex, chunkBuffer.trim(), firstHeading || `Section (Page ${page.pageNumber})`);
        chunkBuffer = p;
        firstHeading = '';
      } else {
        chunkBuffer = chunkBuffer ? `${chunkBuffer}\n\n${p}` : p;
      }
    }

    if (chunkBuffer.trim()) {
      const chunkId = `chk_${docId}_${globalChunkIndex++}`;
      insertChunk.run(chunkId, docId, page.pageNumber, globalChunkIndex, chunkBuffer.trim(), firstHeading || `Page ${page.pageNumber}`);
    }
  }

  return {
    id: docId,
    title: docData.title,
    pageCount: docData.pageCount,
    wordCount: docData.wordCount,
    summary: autoSummary
  };
}
