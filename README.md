# StudyMate — Your Personal AI Study Assistant 🎓

StudyMate is a full-stack, AI-powered academic learning platform that transforms dense study materials (PDFs, DOCX, digital notes) into structured study notes, document-grounded AI tutors, adaptive practice quizzes, spaced-repetition flashcards, and personalized exam schedules.

---

## 🚀 Key Features

1. **Document Upload & Parsing Pipeline**
   - Supports **PDF**, **DOCX**, and **TXT** formats.
   - Text extraction preserving page numbers, chapter sections, and chunk metadata.
   - Real-time progress, document summaries, and sample materials for instant testing.

2. **Grounded AI Notes Generator**
   - Styles: *Detailed Chapter Notes*, *Exam-Oriented Notes*, *Quick Summary*, *Last-Minute Revision Sheet*.
   - Languages: **English**, **Hindi**, and **Hinglish** (conversational academic blend).
   - Levels: *Beginner / School*, *College Student / University*, *Advanced / Competitive Exam*.
   - Notes Workspace: Editable markdown, autosave, rename, clipboard copy, export to Markdown, Text, and Print/PDF.
   - AI Transformation Tools: Simplify explanation, condense to bullet points, expand deeply, or generate real-world examples.

3. **Ask Your PDF (RAG Study Tutor)**
   - Retrieval-Augmented Generation (RAG) using BM25 and semantic relevance ranking over document chunks.
   - Strict factual grounding citing bracketed page references (e.g., `[Page 2]`).
   - Suggested follow-up questions, copy-to-notes button, and Text-to-Speech voice tutor listening.

4. **AI Quiz Generator & "Practice My Mistakes"**
   - Question types: MCQs, True/False, Multiple Select, and Short Answer.
   - Modes: *Practice Mode (Self-Paced)* and *Timed Test Mode* with live countdown timer.
   - Real grading with verified answer keys, accuracy scores, and detailed explanations.
   - **Practice My Mistakes**: One-click targeted practice quiz specifically targeting previously missed concepts!

5. **Spaced Repetition Flashcards (SuperMemo SM-2)**
   - Interactive 3D flip card with keyboard navigation.
   - Review ratings (*Need Practice / 1 Day*, *Good / 3-6 Days*, *Mastered / Easy*).
   - Dynamically calculates intervals, repetitions, and due dates via the SM-2 algorithm.

6. **Personalized Study Planner**
   - Adaptive scheduling based on exam date, daily study hours, confidence level, and syllabus topics.
   - Day-by-day tasks, duration estimates, completion checkboxes, and task rescheduling.

7. **Additional AI Learning Tools**
   - **Concept Explainer**: Multi-level breakdown with analogies, step-by-step mechanics, and practice questions.
   - **Interactive Visual Mind Map**: Hierarchical concept tree extracted from documents with collapsible nodes.
   - **Compare & Simplify**: Side-by-side markdown comparison tables and technical paragraph simplification.
   - **Important Exam Questions**: Short answer (2 marks), long analytical (5 marks), and viva/oral exam questions with model answers.

8. **Progress & Analytics Dashboard**
   - Real metrics: total documents, notes created, tests completed, average accuracy, and study streaks.
   - Dynamic **Weak Topics** detection derived from actual quiz error logs.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS with custom design system tokens, `lucide-react`, `canvas-confetti`.
- **Backend**: Node.js, Express 5, TypeScript (`tsx`).
- **Database**: SQLite via `better-sqlite3` with foreign key enforcement and WAL mode for persistent local storage.
- **Document Processing**: `pdf-parse` (page-level extraction), `mammoth` (DOCX extraction), semantic chunking.
- **AI Integrations**: Google Gemini (`@google/genai`) and OpenAI (`openai`), plus high-precision local heuristic extraction fallback.

---

## 📦 Setup & Run Instructions

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24.16.0)
- **npm** v9+

### 2. Installation
Dependencies are already installed. If starting in a new clone:
```bash
# Install root & backend dependencies
npm install

# Install frontend dependencies
npm --prefix client install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=studymate_super_secure_jwt_secret_key_2026

# To enable Live AI with Google Gemini:
GEMINI_API_KEY=your_gemini_api_key_here

# Or with OpenAI:
OPENAI_API_KEY=your_openai_api_key_here

AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
OPENAI_MODEL=gpt-4o-mini
```
*(Note: You can also enter or update your API key directly in the StudyMate web UI under **Settings → AI Provider & API Key**!)*

### 4. Running the Application

To run the server and client concurrently in development mode:
```bash
npm run dev
```

Or to run the unified production build on port 5000:
```bash
npm run build
npm start
```
Visit: **`http://localhost:5000`** (or `http://localhost:5173` if running Vite dev server).

### 5. Running Verification Tests
To run the automated end-to-end integration test suite:
```bash
npx tsx server/src/test-e2e.ts
```

---

## 🎨 Design Philosophy
- **Colors**: Warm Ivory background (`#FBF9F5`), Muted Lavender / Soft Purple accents (`#7C3AED`, `#EDE9FE`), Dark Navy typography (`#1E1B4B`).
- **Dark Mode**: High-contrast Slate Charcoal palette (`#0B0F17`, `#151B28`, `#8B5CF6`).
- **Typography**: Google Fonts *Outfit* (Headings & Branding) and *Inter* (Body).
