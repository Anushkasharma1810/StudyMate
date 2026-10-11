import { getAiConfigForUser, generateNotes, answerPdfQuestion, generateQuizQuestions, generateFlashcards, generateStudyPlan } from './services/aiService.js';
import { parseDocumentFile, saveDocumentAndChunks } from './services/documentService.js';
import { retrieveRelevantChunks } from './services/ragService.js';
import { initDatabase, db } from './db/database.js';
import fs from 'fs';
import path from 'path';

function createQuantumMechanicsPdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 210 >> stream
BT
/F1 14 Tf
50 720 Td
(Quantum Mechanics Lecture Notes) Tj
0 -30 Td
(Chapter 1: Wave-Particle Duality) Tj
0 -25 Td
(Louis de Broglie proposed that matter exhibits wave-like properties with wavelength lambda = h / p.) Tj
0 -25 Td
(Electron diffraction experiments by Davisson and Germer proved the wave nature of electrons.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
6 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
7 0 obj << /Length 220 >> stream
BT
/F1 14 Tf
50 720 Td
(Chapter 2: Heisenberg Uncertainty Principle) Tj
0 -30 Td
(Werner Heisenberg formulated that Delta x times Delta p is greater than or equal to hbar / 2.) Tj
0 -25 Td
(This principle establishes fundamental limits on measuring position and momentum simultaneously.) Tj
0 -25 Td
(Schrodinger wave equation describes quantum mechanical states via the wave function psi.) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000022 00000 n 
0000000411 00000 n 
0000000673 00000 n 
0000000750 00000 n 
0000001020 00000 n 
trailer << /Size 8 /Root 1 0 R >>
startxref
1290
%%EOF`;
  return Buffer.from(content);
}

async function verifyGeminiLive() {
  console.log('🔬 Starting Live Gemini API & Quality Audit Test Suite...\n');

  initDatabase();

  // 1. Verify API Key Loading from .env
  const config = getAiConfigForUser('user_demo_studymate_001');
  console.log(`1. AI Provider Configuration:`);
  console.log(`   Provider: ${config.provider}`);
  console.log(`   Model: ${config.model}`);
  console.log(`   Key Present: ${Boolean(config.apiKey)}`);
  console.log(`   Key Masked Preview: ••••••••${config.apiKey.slice(-4)}`);
  if (!config.apiKey) {
    throw new Error('GEMINI_API_KEY is not loaded from .env!');
  }

  // 2. Parse Real PDF
  const testPdfPath = path.resolve(process.cwd(), 'uploads', 'live_audit_test.pdf');
  fs.writeFileSync(testPdfPath, createQuantumMechanicsPdf());
  const parsed = await parseDocumentFile(testPdfPath, 'Quantum_Mechanics_Lecture.pdf', 'application/pdf');
  console.log(`\n2. Real PDF Parsed:`);
  console.log(`   Pages: ${parsed.pageCount}, Words: ${parsed.wordCount}`);
  console.log(`   Extracted snippet: "${parsed.fullText.slice(0, 100)}..."`);

  const docId = 'doc_audit_' + Date.now();
  const userId = 'user_demo_studymate_001';
  saveDocumentAndChunks(docId, userId, parsed, 'Quantum_Mechanics_Lecture.pdf', 'PDF', parsed.fullText.length, testPdfPath, 'Physics');

  // 3. Test Ask Your PDF with Live Gemini
  console.log('\n3. Testing Ask Your PDF (RAG + Gemini Chat)...');
  const chunks = retrieveRelevantChunks([docId], 'What is de Broglie wavelength formula?');
  console.log(`   Retrieved chunks: ${chunks.length} chunks (Top page: ${chunks[0]?.pageNumber})`);

  const chatRes = await answerPdfQuestion(
    'Quantum Mechanics Lecture',
    chunks,
    'What did Louis de Broglie propose and what is the formula?',
    [],
    'en',
    userId
  );
  console.log(`   isAi: ${chatRes.isAi} (Provider: ${chatRes.provider || 'none'})`);
  console.log(`   Source pages cited: [Page ${chatRes.sourcePages.join(', ')}]`);
  console.log(`   Suggested questions: ${chatRes.suggestedQuestions.length}`);
  console.log(`   Answer snippet: "${chatRes.answer.slice(0, 150)}..."`);
  if (chatRes.warning) console.log(`   Warning: ${chatRes.warning}`);

  // 4. Test AI Notes Generation with Live Gemini
  console.log('\n4. Testing AI Notes Generation with Gemini...');
  const notesRes = await generateNotes(
    'Quantum Mechanics Lecture',
    parsed.fullText,
    {
      noteType: 'detailed',
      length: 'balanced',
      language: 'en',
      learningLevel: 'college',
      includeExamples: true,
      highlightDefinitions: true,
      highlightFormulas: true,
      generatePracticeQuestions: true
    },
    userId
  );
  console.log(`   isAi: ${notesRes.isAi} (Provider: ${notesRes.provider || 'none'}, Model: ${notesRes.model || 'none'})`);
  console.log(`   Notes content length: ${notesRes.content.length} characters`);
  console.log(`   Notes preview:\n${notesRes.content.slice(0, 200)}...`);
  if (notesRes.warning) console.log(`   Warning: ${notesRes.warning}`);

  // 5. Test Quiz Generation with Live Gemini
  console.log('\n5. Testing Quiz Generation with Gemini...');
  const quizRes = await generateQuizQuestions({
    documentTitle: 'Quantum Mechanics Lecture',
    documentText: parsed.fullText,
    questionCount: 3,
    difficulty: 'medium',
    questionTypes: ['mcq', 'true_false'],
    userId
  });
  console.log(`   isAi: ${quizRes.isAi}`);
  console.log(`   Questions generated: ${quizRes.questions.length}`);
  if (quizRes.questions.length > 0) {
    console.log(`   Sample Q1: "${quizRes.questions[0].questionText}"`);
    console.log(`   Options: ${JSON.stringify(quizRes.questions[0].options)}`);
    console.log(`   Answer: ${quizRes.questions[0].correctAnswer}`);
    console.log(`   Explanation: "${quizRes.questions[0].explanation?.slice(0, 80)}..."`);
  }
  if (quizRes.warning) console.log(`   Warning: ${quizRes.warning}`);

  // 6. Test Flashcards with Live Gemini
  console.log('\n6. Testing Flashcards Generation with Gemini...');
  const flashRes = await generateFlashcards('Quantum Mechanics Lecture', parsed.fullText, 4, userId);
  console.log(`   isAi: ${flashRes.isAi}`);
  console.log(`   Cards count: ${flashRes.cards.length}`);
  if (flashRes.cards.length > 0) {
    console.log(`   Sample Card Front: "${flashRes.cards[0].front}"`);
    console.log(`   Sample Card Back: "${flashRes.cards[0].back}"`);
  }
  if (flashRes.warning) console.log(`   Warning: ${flashRes.warning}`);

  // 7. Test Study Planner with Live Gemini
  console.log('\n7. Testing Study Planner with Gemini...');
  const planRes = await generateStudyPlan(
    'Quantum Physics',
    '2026-11-01',
    2.5,
    'medium',
    ['Wave Particle Duality', 'Heisenberg Uncertainty', 'Schrodinger Equation'],
    userId
  );
  console.log(`   isAi: ${planRes.isAi}`);
  console.log(`   Tasks count: ${planRes.tasks.length}`);
  if (planRes.tasks.length > 0) {
    console.log(`   Sample Task: "${planRes.tasks[0].title}" (${planRes.tasks[0].durationMins} mins, Due: ${planRes.tasks[0].dueDate})`);
  }

  // Cleanup
  if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);

  console.log('\n🎉 COMPLETED LIVE GEMINI VERIFICATION TEST RUN!\n');
}

verifyGeminiLive().catch(err => {
  console.error('❌ Live Gemini Verification Failed:', err);
  process.exit(1);
});
