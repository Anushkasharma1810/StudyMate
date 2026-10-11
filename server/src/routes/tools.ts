import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { explainConcept, generateMindMap, executeAiPrompt, getAiConfigForUser } from '../services/aiService.js';

const router = Router();

// Concept Explainer
router.post('/explain-concept', async (req: AuthRequest, res: Response) => {
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
router.post('/mind-map', async (req: AuthRequest, res: Response) => {
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
router.post('/compare-simplify', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { mode, text, conceptA, conceptB } = req.body;

    const config = getAiConfigForUser(userId);

    if (mode === 'compare') {
      const prompt = `Compare and contrast **${conceptA}** vs **${conceptB}**.\nProvide a markdown comparison table with criteria (Definition, Mechanism, Pros/Cons, Real-world Example) followed by a concise synthesis.`;
      try {
        const result = await executeAiPrompt(prompt, 'You are an academic comparison expert. Generate clear markdown tables.', config);
        res.json({ result: result.text, isAi: true });
      } catch {
        res.json({
          result: `| Criteria | ${conceptA} | ${conceptB} |\n| :--- | :--- | :--- |\n| **Core Focus** | Primary mechanism and theoretical foundation | Alternative or applied methodology |\n| **Strengths** | High precision and formalized structure | Flexibility and adaptability in complex scenarios |\n| **Use Case** | Foundational implementations | Optimized dynamic environments |\n\n### Summary Comparison\nBoth concepts solve fundamental problems in their respective domains with different trade-offs.`,
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
          result: `### Simplified Explanation\n\n${text}\n\n💡 **Analogy:** Think of this like water flowing through pipes; pressure drives the flow, and resistance controls the pace.`,
          isAi: false
        });
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Important Questions Generator (short, long, descriptive, viva)
router.post('/important-questions', async (req: AuthRequest, res: Response) => {
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
    const systemPrompt = `You are a university professor. Generate 6 important exam preparation questions from the document:
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
1. **Define the primary governing law discussed in the text.**
   - *Key Points:* Mention foundational definitions and specific boundary conditions.
2. **State two key differences between the primary and secondary mechanisms.**
   - *Key Points:* Contrast speed, accuracy, and operational prerequisites.

### B. Long Analytical Questions (5 Marks)
1. **Explain the step-by-step workflow with a real-world scenario.**
   - *Key Points:* Walk through initiation, processing, error-handling, and evaluation.
2. **Discuss the theoretical limitations and common misconceptions.**
   - *Key Points:* Detail edge cases and practical workarounds.

### C. Viva Voce / Oral Examination Questions
1. *"Why is this concept preferred over older alternatives?"*
   - *Expected Response:* Because of efficiency, consistency, and scalability under varying loads.
2. *"What happens if input parameters are reversed?"*
   - *Expected Response:* The system fails graceful validation or yields inverse outputs.`,
        isAi: false
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
