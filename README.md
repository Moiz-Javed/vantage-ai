# Vantage AI

A multimodal AI assistant: streaming chat, voice in/out, PDF question-answering
(RAG), image recognition, and live HTML/CSS/JS preview — all in one app.

**Stack:** React 18 + Vite + Tailwind + Framer Motion (frontend) · Node.js +
Express + MongoDB (backend) · Google Gemini 2.5 Flash (streaming + vision +
embeddings) · Clerk (auth) · Web Speech API (voice, built into the browser,
free) · a from-scratch RAG pipeline (chunk → embed → cosine similarity).

Every third-party piece used here has a free tier — see setup below.

## What it does

- 🤖 **Streaming responses** — tokens appear as Gemini generates them, like ChatGPT
- 🎙️ **Voice input** — speak your message (Web Speech API, no key needed)
- 🔊 **Voice output** — click "Listen" on any reply to hear it read aloud
- 🎧 **Hands-free mode** — toggle it on and every reply is read aloud automatically, no clicking required
- 📄 **PDF Q&A** — upload a PDF, it's chunked + embedded, and questions get
  answered using the most relevant passages (retrieval-augmented generation)
- 🖼️ **Image recognition** — upload an image, Gemini's vision model describes
  or answers questions about it
- 📥 **Drag-and-drop uploads** — drop a PDF or image anywhere on the chat, no need to hunt for a button
- ▶️ **Live code preview** — ask for HTML, click **Run**, and it executes in a sandboxed iframe right in the chat
- 🧩 **Combined multi-file preview** — if a reply contains separate HTML, CSS, and JS blocks (not just one inline blob), they're automatically stitched into a single runnable page
- 🎨 **Real syntax highlighting + one-click copy** on every code block
- 🎭 **Assistant personas** — switch between Friendly, Professional, Concise, and Creative tones mid-conversation; it changes how the model actually responds, not just a label
- ✏️ **Edit & resend** — fix a message you sent and the conversation continues from there
- 🔁 **Regenerate** — not happy with a reply? Get a fresh one without retyping your question
- 📤 **Export to Markdown** — download any conversation as a `.md` file
- 💡 **Prompt suggestions** — quick-start chips on the empty state instead of a blank box
- 🌙 **Dark/light theme** — persisted, respects system preference on first load
- 🔐 **Authentication** — sign-up/sign-in via Clerk, each user's conversations
  and documents are private to them

## Project layout

```
vantage-ai/
├── backend/                 # Express API
│   ├── server.js
│   ├── routes/               # chat (streaming), pdf (upload+RAG), image
│   ├── services/             # gemini.js (chat/vision/embeddings), rag.js
│   ├── models/               # Conversation, DocumentChunk (Mongoose)
│   ├── middleware/           # Clerk auth
│   └── .env.example
└── frontend/                 # React + Vite app
    ├── src/
    │   ├── pages/             # ChatPage, SignInPage, SignUpPage
    │   ├── components/        # Sidebar, Composer, MessageBubble, CodePreview, ...
    │   ├── hooks/              # useSpeechToText, useTextToSpeech, useTheme
    │   └── lib/api.js          # streaming fetch client
    └── .env.example
```

## Setup — free accounts you'll need (all free tier, no card required for most)

### 1. Google Gemini API key (chat, vision, embeddings)
1. Go to **https://aistudio.google.com/apikey**
2. Sign in with a Google account, click **Create API key**
3. Copy it — you'll paste it into `backend/.env`

### 2. Clerk (authentication)
1. Go to **https://dashboard.clerk.com**, sign up, create an application
2. On the **API Keys** page, copy both:
   - **Publishable key** → goes in `frontend/.env`
   - **Secret key** → goes in `backend/.env`

### 3. MongoDB Atlas (database — chat history + PDF memory)
1. Go to **https://cloud.mongodb.com**, sign up
2. Create a free **M0** cluster (no cost)
3. Under **Database Access**, create a database user + password
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) for now
5. Click **Connect → Drivers**, copy the connection string — it looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`
6. Paste it into `backend/.env` as `MONGODB_URI` (add `/vantage-ai` before the `?` to name the database)

## Running it locally

### Backend
```bash
cd backend
npm install
cp .env.example .env
# paste your Gemini key, Clerk secret key, and MongoDB URI into .env
npm start
```
Runs on **http://localhost:5000**.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# paste your Clerk publishable key into .env
npm run dev
```
Runs on **http://localhost:5173** and opens automatically. In dev, Vite
proxies `/api/...` calls to the backend on port 5000 — no CORS setup needed.

Open the app, sign up (Clerk handles this), and start chatting.

## Deploying (free tiers)

- **Frontend → Vercel**: import the `frontend` folder as a project, set the
  root directory to `frontend`, add the `VITE_CLERK_PUBLISHABLE_KEY` and
  `VITE_API_URL` (your deployed backend's URL) environment variables.
- **Backend → Render**: new Web Service, root directory `backend`, build
  command `npm install`, start command `npm start`, add all the `backend/.env`
  variables in Render's dashboard, plus `FRONTEND_URL` set to your Vercel URL.
- In Clerk's dashboard, add your live Vercel domain under **Domains** so
  sign-in works in production, not just `localhost`.

## Notes on the free tiers

- **Gemini API**: free tier has per-minute/per-day rate limits — plenty for
  personal use, not for high-traffic production.
- **Clerk**: free up to 10,000 monthly active users.
- **MongoDB Atlas M0**: free forever, 512MB storage cap.
- **Vercel / Render**: free tiers for hobby projects; Render's free web
  services sleep after inactivity and take ~30s to wake on the next request.

## How the RAG (PDF Q&A) pipeline works

1. Upload a PDF → text extracted with `pdf-parse`
2. Text is split into ~900-character overlapping chunks
3. Each chunk is embedded with Gemini's `text-embedding-004` model and stored
   in MongoDB
4. When you ask a question, your question is embedded too, compared against
   every stored chunk with cosine similarity, and the top 4 most relevant
   chunks are handed to Gemini as context before it answers

No separate vector database needed — this runs entirely on MongoDB's free
tier plus plain JavaScript math.
