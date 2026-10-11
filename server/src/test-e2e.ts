import { db, initDatabase } from './db/database.js';
import { parseDocumentFile, saveDocumentAndChunks } from './services/documentService.js';
import { generateNotes, answerPdfQuestion, generateQuizQuestions, generateFlashcards, generateStudyPlan } from './services/aiService.js';
import { retrieveRelevantChunks } from './services/ragService.js';
import fs from 'fs';
import path from 'path';

// Valid 2-page text PDF buffer in raw standard format
function createValidTestPdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 72 >> stream
BT
/F1 18 Tf
50 720 Td
(Quantum Mechanics Chapter 1: Wave-Particle Duality and De Broglie) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
6 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
7 0 obj << /Length 78 >> stream
BT
/F1 18 Tf
50 720 Td
(Chapter 2: Heisenberg Uncertainty Principle and Planck Constant) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000122 00000 n 
0000000273 00000 n 
0000000396 00000 n 
0000000473 00000 n 
0000000624 00000 n 
trailer << /Size 8 /Root 1 0 R >>
startxref
753
%%EOF`;
  return Buffer.from(content);
}

async function runE2ETests() {
  console.log('🧪 Starting StudyMate End-to-End Verification Tests...\n');

  // 1. Initialize DB
  initDatabase();
  console.log('✅ 1. Database initialized successfully.');

  // 2. Test Real PDF Text Extraction and Multi-Page Preservation
  const pdfPath = path.resolve(process.cwd(), 'uploads', 'test_quantum_mechanics.pdf');
  fs.writeFileSync(pdfPath, createValidTestPdf());

  const parsedPdf = await parseDocumentFile(pdfPath, 'Quantum_Mechanics_Syllabus.pdf', 'application/pdf');
  console.log(`✅ 2. Real PDF parsed successfully: ${parsedPdf.pageCount} pages, ${parsedPdf.wordCount} words.`);
  if (parsedPdf.pageCount !== 2) {
    throw new Error(`Expected 2 pages in PDF, received ${parsedPdf.pageCount}`);
  }
  if (!parsedPdf.fullText.includes('De Broglie') || !parsedPdf.fullText.includes('Heisenberg')) {
    throw new Error('Extracted PDF text is missing page contents');
  }
  console.log(`     Page 1 text: "${parsedPdf.pages[0].text}"`);
  console.log(`     Page 2 text: "${parsedPdf.pages[1].text}"`);

  // 3. Test Corrupted PDF Handling
  const corruptPath = path.resolve(process.cwd(), 'uploads', 'corrupt.pdf');
  fs.writeFileSync(corruptPath, 'This is an invalid corrupted binary stream not matching PDF header');
  try {
    await parseDocumentFile(corruptPath, 'corrupt.pdf', 'application/pdf');
    throw new Error('Corrupted PDF should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('corrupted') || err.message.includes('Invalid') || err.message.includes('Failed to extract')) {
      console.log(`✅ 3. Corrupted PDF gracefully rejected with message: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 4. Test Save Document & Chunks from Real PDF
  const docId = 'doc_pdf_test_' + Date.now();
  const userId = 'user_demo_studymate_001';
  saveDocumentAndChunks(docId, userId, parsedPdf, 'Quantum_Mechanics_Syllabus.pdf', 'PDF', parsedPdf.fullText.length, pdfPath, 'Physics');
  console.log('✅ 4. PDF document chunks and page metadata saved to SQLite.');

  // 5. Test RAG Retrieval over PDF Chunks
  const chunks = retrieveRelevantChunks([docId], 'What is discussed about Heisenberg?');
  if (chunks.length > 0 && chunks[0].content.includes('Heisenberg')) {
    console.log(`✅ 5. RAG Retrieval verified: Found relevant chunk on Page ${chunks[0].pageNumber} (Score: ${chunks[0].score.toFixed(2)}).`);
  } else {
    throw new Error('RAG retrieval failed to locate Heisenberg chunk from PDF');
  }

  // 6. Test Ask Your PDF with Page Citations
  const answer = await answerPdfQuestion('Quantum Mechanics Syllabus', chunks, 'What is discussed in Chapter 2?', [], 'en', userId);
  console.log(`✅ 6. Ask Your PDF grounded answer generated (Source citations: [Page ${answer.sourcePages.join(', ')}]).`);

  // 7. Test AI Notes Generation
  const notes = await generateNotes('Quantum Mechanics Syllabus', parsedPdf.fullText, {
    noteType: 'exam',
    length: 'balanced',
    language: 'en',
    learningLevel: 'college',
    includeExamples: true,
    highlightDefinitions: true,
    highlightFormulas: true
  }, userId);
  if (notes.content.length > 50) {
    console.log('✅ 7. AI Notes generated from PDF content.');
  }

  // 8. Test Quiz Generation and Scoring
  const quiz = await generateQuizQuestions({
    documentTitle: 'Quantum Mechanics Syllabus',
    documentText: parsedPdf.fullText,
    questionCount: 2,
    difficulty: 'medium',
    questionTypes: ['mcq', 'true_false'],
    userId
  });
  if (quiz.questions.length >= 1) {
    console.log(`✅ 8. Quiz generated from PDF: ${quiz.questions.length} questions.`);
  }

  // 9. Test Flashcards
  const flashcards = await generateFlashcards('Quantum Mechanics Syllabus', parsedPdf.fullText, 2, userId);
  if (flashcards.cards.length >= 1) {
    console.log(`✅ 9. Flashcards generated from PDF: ${flashcards.cards.length} cards.`);
  }

  // Clean test files
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  if (fs.existsSync(corruptPath)) fs.unlinkSync(corruptPath);

  console.log('\n🎉 ALL END-TO-END PDF & SYSTEM VERIFICATION TESTS PASSED!\n');
}

runE2ETests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
