import { initDatabase, db } from './db/database.js';
import { getAiConfigForUser } from './services/aiService.js';

async function runSettingsVerification() {
  console.log('🧪 Starting Settings & AI Provider Persistence Tests...\n');

  initDatabase();

  const baseUrl = 'http://localhost:5000';
  const testUserId = 'user_demo_studymate_001';

  // 1. Initial State
  const initialMeRes = await fetch(`${baseUrl}/api/auth/me`);
  const initialMe = await initialMeRes.json();
  console.log('✅ 1. GET /api/auth/me status:', initialMeRes.status);
  console.log('     Initial AI Provider:', initialMe.preferences.aiProvider);

  // 2. Save Gemini + API Key
  const testApiKey = 'AIzaSyDemoGeminiKeySample9876';
  const saveRes = await fetch(`${baseUrl}/api/auth/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      theme: 'light',
      language: 'en',
      aiProvider: 'gemini',
      apiKeyOverride: testApiKey
    })
  });
  const saveData = await saveRes.json();
  if (saveRes.status !== 200 || !saveData.success) {
    throw new Error(`Failed to save preferences: ${JSON.stringify(saveData)}`);
  }
  console.log('✅ 2. PUT /api/auth/preferences succeeded: Provider=gemini');

  // Verify response security: never expose plaintext key
  if (saveData.preferences.apiKeyOverride || saveData.preferences.api_key_override) {
    throw new Error('SECURITY VIOLATION: Raw API key returned in API response!');
  }
  if (!saveData.preferences.hasApiKeyOverride || saveData.preferences.keyPreview !== '••••••••9876') {
    throw new Error(`Expected masked keyPreview, got: ${saveData.preferences.keyPreview}`);
  }
  console.log(`✅ 3. Security Verified: Key is masked as "${saveData.preferences.keyPreview}", raw key NEVER exposed.`);

  // 3. Simulate Page Refresh: Call GET /api/auth/me again
  const refreshedMeRes = await fetch(`${baseUrl}/api/auth/me`);
  const refreshedMe = await refreshedMeRes.json();
  if (refreshedMe.preferences.aiProvider !== 'gemini' || !refreshedMe.preferences.hasApiKeyOverride) {
    throw new Error(`Persistence failure on refresh: ${JSON.stringify(refreshedMe)}`);
  }
  console.log('✅ 4. Persistence Verified: Provider is "gemini" and key status is active after refresh.');

  // 4. Verify Backend aiService resolves configuration correctly
  const aiConfig = getAiConfigForUser(testUserId);
  if (aiConfig.provider !== 'gemini' || aiConfig.apiKey !== testApiKey) {
    throw new Error(`aiService config mismatch: expected gemini with test key, got: ${JSON.stringify(aiConfig)}`);
  }
  console.log('✅ 5. Backend AI Engine Verified: aiService correctly retrieves Gemini provider and decrypted key from SQLite.');

  // 5. Test Partial Update: Change theme without providing key (should preserve existing key)
  const partialRes = await fetch(`${baseUrl}/api/auth/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      theme: 'dark'
    })
  });
  const partialData = await partialRes.json();
  if (!partialData.preferences.hasApiKeyOverride || partialData.preferences.theme !== 'dark') {
    throw new Error(`Partial update failed to preserve existing key: ${JSON.stringify(partialData)}`);
  }
  console.log('✅ 6. Partial Update Verified: Updating theme preserved the existing Gemini API key.');

  // 6. Test Validation: Invalid AI provider rejected
  const invalidRes = await fetch(`${baseUrl}/api/auth/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aiProvider: 'unsupported_model'
    })
  });
  if (invalidRes.status !== 400) {
    throw new Error(`Expected 400 for invalid provider, got ${invalidRes.status}`);
  }
  console.log('✅ 7. Input Validation Verified: Invalid AI provider gracefully rejected with HTTP 400.');

  // 7. Test Removing API Key override
  const clearKeyRes = await fetch(`${baseUrl}/api/auth/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKeyOverride: ''
    })
  });
  const clearKeyData = await clearKeyRes.json();
  if (clearKeyData.preferences.hasApiKeyOverride) {
    throw new Error('Failed to remove API key override: ' + JSON.stringify(clearKeyData));
  }
  console.log('✅ 8. Remove Key Verified: Successfully removed API key override.');

  console.log('\n🎉 ALL SETTINGS PERSISTENCE & AI PROVIDER TESTS PASSED!\n');
}

runSettingsVerification().catch(err => {
  console.error('❌ Settings test failed:', err);
  process.exit(1);
});
