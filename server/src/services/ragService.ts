import { db } from '../db/database.js';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  content: string;
  heading: string | null;
  score: number;
}

// Tokenize and clean text for BM25/TF-IDF scoring
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

// Stopwords to filter out noise
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her', 'was',
  'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now',
  'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she',
  'too', 'use', 'what', 'with', 'this', 'that', 'from', 'they', 'will', 'have', 'more',
  'about', 'which', 'their', 'there', 'would', 'other', 'into', 'some', 'could', 'them',
  'these', 'then', 'than', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'come',
  'only', 'also', 'after', 'first', 'back', 'most', 'such', 'even', 'here', 'look', 'over'
]);

export function retrieveRelevantChunks(
  documentIds: string[],
  query: string,
  topK: number = 4
): RetrievedChunk[] {
  if (!documentIds || documentIds.length === 0 || !query.trim()) {
    return [];
  }

  const placeholders = documentIds.map(() => '?').join(',');
  const chunks = db.prepare(`
    SELECT id, document_id as documentId, page_number as pageNumber, content, heading
    FROM document_chunks
    WHERE document_id IN (${placeholders})
  `).all(...documentIds) as any[];

  if (chunks.length === 0) {
    return [];
  }

  const queryTokens = tokenize(query).filter(t => !STOPWORDS.has(t));
  if (queryTokens.length === 0) {
    // If query has only common words, use raw tokens
    return chunks.slice(0, topK).map(c => ({ ...c, score: 1.0 }));
  }

  // Calculate term frequencies and document frequencies
  const df: Record<string, number> = {};
  const chunkTokenCache: Map<string, string[]> = new Map();

  for (const chunk of chunks) {
    const tokens = tokenize(chunk.content);
    chunkTokenCache.set(chunk.id, tokens);
    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      df[token] = (df[token] || 0) + 1;
    }
  }

  const totalChunks = chunks.length;
  const scoredChunks: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const tokens = chunkTokenCache.get(chunk.id) || [];
    const tokenCount = tokens.length || 1;
    let score = 0;

    const tfMap: Record<string, number> = {};
    for (const t of tokens) {
      tfMap[t] = (tfMap[t] || 0) + 1;
    }

    for (const qToken of queryTokens) {
      const tf = tfMap[qToken] || 0;
      if (tf > 0) {
        // BM25-style IDF
        const docFreq = df[qToken] || 1;
        const idf = Math.log(1 + (totalChunks - docFreq + 0.5) / (docFreq + 0.5));
        // Term frequency normalization
        const normalizedTf = (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (tokenCount / 250)));
        score += idf * normalizedTf;
      }
    }

    // Boost score if heading matches query terms
    if (chunk.heading) {
      const headingTokens = tokenize(chunk.heading);
      for (const qToken of queryTokens) {
        if (headingTokens.includes(qToken)) {
          score += 2.5;
        }
      }
    }

    // Query exact substring match bonus
    const queryLower = query.toLowerCase();
    if (chunk.content.toLowerCase().includes(queryLower)) {
      score += 3.0;
    }

    if (score > 0) {
      scoredChunks.push({
        id: chunk.id,
        documentId: chunk.documentId,
        pageNumber: chunk.pageNumber,
        content: chunk.content,
        heading: chunk.heading,
        score
      });
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}
