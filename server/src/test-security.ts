import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { db, initDatabase } from './db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'studymate_super_secure_jwt_secret_key_2026';
const baseUrl = 'http://localhost:5000';

function generateToken(userId: string, email: string) {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

async function runSecurityTests() {
  console.log('🔒 Starting StudyMate Security & Isolation Test Suite...\n');

  initDatabase();

  // 1. Verify .gitignore presence and rules
  console.log('1. Checking Root .gitignore configuration...');
  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    throw new Error('.gitignore file is missing in project root!');
  }
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const requiredPatterns = ['.env', 'uploads/*', 'data/*', '*.db', 'client/dist/'];
  for (const pat of requiredPatterns) {
    if (!gitignoreContent.includes(pat)) {
      throw new Error(`.gitignore missing critical security pattern: ${pat}`);
    }
  }
  console.log('✅ 1. Root .gitignore verified: excludes .env, uploads, data, and database files.');

  // Setup Two Isolated Users
  const userAliceId = 'usr_sec_alice_' + Date.now();
  const userBobId = 'usr_sec_bob_' + Date.now();
  const aliceToken = generateToken(userAliceId, 'alice@test.edu');
  const bobToken = generateToken(userBobId, 'bob@test.edu');

  // Insert users into SQLite
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
    userAliceId, 'Alice Student', `alice_${Date.now()}@test.edu`, 'hash_placeholder'
  );
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
    userBobId, 'Bob Student', `bob_${Date.now()}@test.edu`, 'hash_placeholder'
  );

  // Alice creates a private study document
  const aliceDocId = 'doc_alice_private_' + Date.now();
  db.prepare(`
    INSERT INTO documents (
      id, user_id, title, filename, file_type, file_size, storage_path, processing_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')
  `).run(aliceDocId, userAliceId, "Alice's Secret Medical Research", 'medical_notes.pdf', 'PDF', 1024, 'uploads/fake_alice.pdf');

  db.prepare(`
    INSERT INTO document_chunks (
      id, document_id, page_number, chunk_index, content
    ) VALUES (?, ?, 1, 0, 'Confidential patient clinical trials data.')
  `).run('chk_alice_1', aliceDocId);

  console.log('✅ 2. Test users and Alice private document created.');

  // Test 2: Bob tries to GET Alice's document details
  const bobGetDocRes = await fetch(`${baseUrl}/api/documents/${aliceDocId}`, {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  if (bobGetDocRes.status !== 404) {
    throw new Error(`Bob should receive 404 for Alice document, got: ${bobGetDocRes.status}`);
  }
  console.log('✅ 3. GET /api/documents/:id: Bob denied access to Alice document (404).');

  // Test 3: Bob tries to DELETE Alice's document
  const bobDelDocRes = await fetch(`${baseUrl}/api/documents/${aliceDocId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  if (bobDelDocRes.status !== 404) {
    throw new Error(`Bob should receive 404 when trying to delete Alice document, got: ${bobDelDocRes.status}`);
  }
  console.log('✅ 4. DELETE /api/documents/:id: Bob blocked from deleting Alice document (404).');

  // Test 4: Bob tries to generate AI Notes on Alice's document
  const bobNotesRes = await fetch(`${baseUrl}/api/notes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`
    },
    body: JSON.stringify({
      documentId: aliceDocId,
      noteType: 'summary'
    })
  });
  if (bobNotesRes.status !== 404 && bobNotesRes.status !== 403) {
    throw new Error(`Bob should be blocked from generating notes on Alice document, got: ${bobNotesRes.status}`);
  }
  console.log(`✅ 5. POST /api/notes/generate: Bob denied access to Alice document (${bobNotesRes.status}).`);

  // Test 5: Bob tries to generate Quiz on Alice's document
  const bobQuizRes = await fetch(`${baseUrl}/api/quizzes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`
    },
    body: JSON.stringify({
      documentId: aliceDocId,
      questionCount: 2
    })
  });
  if (bobQuizRes.status !== 404 && bobQuizRes.status !== 403) {
    throw new Error(`Bob should be blocked from generating quiz on Alice document, got: ${bobQuizRes.status}`);
  }
  console.log(`✅ 6. POST /api/quizzes/generate: Bob denied access to Alice document (${bobQuizRes.status}).`);

  // Test 6: Bob tries to generate Flashcards on Alice's document
  const bobFlashRes = await fetch(`${baseUrl}/api/flashcards/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`
    },
    body: JSON.stringify({
      documentId: aliceDocId,
      cardCount: 3
    })
  });
  if (bobFlashRes.status !== 404 && bobFlashRes.status !== 403) {
    throw new Error(`Bob should be blocked from generating flashcards on Alice document, got: ${bobFlashRes.status}`);
  }
  console.log(`✅ 7. POST /api/flashcards/generate: Bob denied access to Alice document (${bobFlashRes.status}).`);

  // Test 7: Bob tries to generate Mind Map on Alice's document
  const bobMindMapRes = await fetch(`${baseUrl}/api/tools/mind-map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`
    },
    body: JSON.stringify({
      documentId: aliceDocId
    })
  });
  if (bobMindMapRes.status !== 404 && bobMindMapRes.status !== 403) {
    throw new Error(`Bob should be blocked from generating mind map on Alice document, got: ${bobMindMapRes.status}`);
  }
  console.log(`✅ 8. POST /api/tools/mind-map: Bob denied access to Alice document (${bobMindMapRes.status}).`);

  // Test 8: Bob tries to create chat session on Alice's document
  const bobChatRes = await fetch(`${baseUrl}/api/chat/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`
    },
    body: JSON.stringify({
      documentId: aliceDocId,
      title: 'Hacked Session'
    })
  });
  if (bobChatRes.status !== 404 && bobChatRes.status !== 403) {
    throw new Error(`Bob should be blocked from creating chat session on Alice document, got: ${bobChatRes.status}`);
  }
  console.log(`✅ 9. POST /api/chat/sessions: Bob denied access to Alice document (${bobChatRes.status}).`);

  // Test 9: Alice CAN access her own document
  const aliceGetDocRes = await fetch(`${baseUrl}/api/documents/${aliceDocId}`, {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  if (aliceGetDocRes.status !== 200) {
    throw new Error(`Alice should successfully access her own document, got: ${aliceGetDocRes.status}`);
  }
  console.log('✅ 10. Legitimate Owner Verified: Alice successfully accessed her own document (200 OK).');

  // Clean test records
  db.prepare('DELETE FROM documents WHERE id = ?').run(aliceDocId);
  db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(userAliceId, userBobId);

  console.log('\n🎉 ALL SECURITY & MULTI-TENANT ISOLATION TESTS PASSED!\n');
}

runSecurityTests().catch(err => {
  console.error('❌ Security Test Failed:', err);
  process.exit(1);
});
