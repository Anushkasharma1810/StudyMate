import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { aiLimiters } from '../middleware/rateLimit.js';
import { explainConcept, generateMindMap, executeAiPrompt, getAiConfigForUser } from '../services/aiService.js';

const router = Router();

// Concept Explainer
router.post('/explain-concept', ...aiLimiters, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { concept, level = 'beginner', documentId } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Concept is required.' });
    }

    let contextText = '';
    if (documentId) {
      const doc: any = db.prepare('SELECT id FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found or access denied.' });
      }
      const chunks: any[] = db.prepare('SELECT content FROM document_chunks WHERE document_id = ? LIMIT 5').all(documentId);
      contextText = chunks.map(c => c.content).join('\n\n');
    }

    const result = await explainConcept(concept, level, contextText, userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mind Map generator
router.post('/mind-map', ...aiLimiters, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required.' });
    }

    const doc: any = db.prepare('SELECT title FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const chunks: any[] = db.prepare('SELECT content FROM document_chunks WHERE document_id = ? LIMIT 6').all(documentId);
    const text = chunks.map(c => c.content).join('\n\n');

    const result = await generateMindMap(doc.title, text, userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Compare & Simplify
router.post('/compare-simplify', ...aiLimiters, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { mode, text, conceptA, conceptB } = req.body;

    const config = getAiConfigForUser(userId);

    if (mode === 'compare') {
      const prompt = `Compare and contrast **${conceptA}** vs **${conceptB}**.\nThese can be from ANY subject (science, commerce, history, law, literature, languages, arts, etc.).\nProvide a markdown comparison table with criteria that suit the subject (e.g. Definition, Key Features, How it works / Context, Pros/Cons or Significance, Example) followed by a concise synthesis.`;
      try {
        const result = await executeAiPrompt(prompt, 'You are an academic comparison expert. Generate clear markdown tables.', config);
        res.json({ result: result.text, isAi: true });
      } catch {
        res.json({
          result: `| Criteria | ${conceptA} | ${conceptB} |\n| :--- | :--- | :--- |\n| **Definition** | What ${conceptA} means | What ${conceptB} means |\n| **Key Features** | Main characteristics | Main characteristics |\n| **Example** | A typical example | A typical example |\n\n### Summary Comparison\nAI is temporarily unavailable — please try again in a minute for a detailed comparison.`,
          isAi: false
        });
      }
    } else {
      // Simplify
      const prompt = `Explain the following text in simple, crystal-clear language that even a high school student can understand. Use an everyday analogy.\n\nText:\n${text}`;
      try {
        const result = await executeAiPrompt(prompt, 'You are an educational tutor who makes complex topics simple.', config);
        res.json({ result: result.text, isAi: true });
      } catch {
        res.json({
          result: `### Simplified Explanation\n\n${text}\n\n💡 AI is temporarily unavailable — please try again in a minute for a simplified explanation.`,
          isAi: false
        });
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Important Questions Generator (short, long, descriptive, viva)
router.post('/important-questions', ...aiLimiters, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const doc: any = db.prepare('SELECT title FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const chunks: any[] = db.prepare('SELECT content FROM document_chunks WHERE document_id = ? LIMIT 6').all(documentId);
    const text = chunks.map(c => c.content).join('\n\n');

    const config = getAiConfigForUser(userId);
    const systemPrompt = `You are an experienced teacher/examiner in the subject of this document (infer the subject from the text — it may be any field or exam). Generate 6 important exam preparation questions from the document:
- 2 Short Answer Questions (2-3 marks) with answers
- 2 Long / Analytical Questions (5-10 marks) with answers
- 2 Oral / Viva Voce Questions with expected answers
Clearly label these as practice & revision questions.`;

    try {
      const result = await executeAiPrompt(`Document: "${doc.title}"\nText:\n${text}`, systemPrompt, config);
      res.json({ questions: result.text, isAi: true });
    } catch {
      res.json({
        questions: `## 📝 Important Exam Practice Questions for ${doc.title}
*(Notice: Practice and revision questions derived from document text)*

### A. Short Answer Questions (2 Marks)
1. **Define the most important term or idea discussed in the text.**
   - *Key Points:* Give a precise definition and one example.
2. **State two key differences between two related ideas in this chapter.**
   - *Key Points:* Compare them point by point.

### B. Long Analytical Questions (5 Marks)
1. **Explain the main topic of this document in detail with an example.**
   - *Key Points:* Introduction, key points in order, example, conclusion.
2. **Discuss the significance, limitations, or criticisms of the main idea.**
   - *Key Points:* Give balanced arguments with examples from the material.

### C. Viva Voce / Oral Examination Questions
1. *"Summarize this chapter in two sentences."*
   - *Expected Response:* The central idea and why it matters.
2. *"Give a real-life example related to this topic."*
   - *Expected Response:* Any relevant example that clearly applies the concept.

*(AI is temporarily unavailable — try again in a minute for questions generated from your document.)*`,
        isAi: false
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
