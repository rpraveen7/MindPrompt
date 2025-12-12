# 🧠 MindPrompt

**MindPrompt** is an "Intelligent Intermediary" that treats prompt engineering as a deterministic engineering problem. It optimizes raw user prompts using the **CO-STAR framework** (Context, Objective, Style, Tone, Audience, Response), leverages vector similarity search for "Golden Prompts," and provides real-time readability metrics.

---

## 🚀 Features

- **✨ AI Optimization:** Automatically rewrites vague prompts into structured, high-quality instructions using **Gemini 1.5 Flash**.
- **🔍 Vector Search:** Finds semantically similar "Golden Prompts" from a curated dataset using **FAISS** and **Sentence Transformers**.
- **📊 Real-time Analytics:** Calculates token cost reduction and Flesch-Kincaid readability scores instantly.
- **🌓 UI/UX:** Polished **Dark Theme**, custom 50/50 Diff Viewer, and developer-friendly keyboard shortcuts (Enter to submit).
- **🔐 Secure Auth:** Instagram-style Login/Signup flow backed by **Supabase (PostgreSQL)**, using **Bcrypt** hashing and **JWT** sessions.
- **🕰️ Smart History:** Auto-saves chat history to LocalStorage with manual deletion and strict **7-day auto-expiry**.

---

## 🏗 Tech Stack

### **Frontend (Client)**
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS (Slate/Emerald Dark Mode)
- **Icons:** Lucide React

### **Backend (Server)**
- **Framework:** FastAPI (Python 3.9+)
- **AI Orchestration:** LiteLLM (Google Gemini)
- **Vector DB:** FAISS (Local CPU Index)
- **Database Driver:** Psycopg2 (PostgreSQL)
- **Security:** Passlib (Bcrypt), Python-Jose (JWT)

### **Infrastructure**
- **Database:** Supabase (Managed PostgreSQL)
- **LLM Provider:** Google Gemini API

---

## 🛠️ Installation & Setup

### **1. Prerequisites**
- Node.js 18+
- Python 3.9+
- A [Supabase](https://supabase.com) Project
- A [Google Gemini API Key](https://aistudio.google.com/)

### **2. Clone & Install**

```bash
# Clone the repo (if applicable) or navigate to project folder
cd MindPrompt

# Install Frontend Dependencies
cd client
npm install

# Install Backend Dependencies
cd ../server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### **3. Environment Configuration**

Create a `.env` file in `server/`:

```env
# server/.env
GEMINI_API_KEY=AIzaSy...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### **4. Initialize Data**

Run the seed script to download the "Golden Prompts" dataset and build the FAISS vector index locally:

```bash
cd server
./venv/bin/python seed_faiss.py
```

---

## ▶️ Running the Application

### **Option 1: One-Click Script (macOS/Linux)**
We have included a script that opens separate Terminal tabs for backend and frontend automatically.

```bash
./start.sh
```

### **Option 2: Manual Start**

**Terminal 1 (Backend):**
```bash
cd server
./venv/bin/uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
MindPrompt/
├── client/                 # Next.js Frontend
│   ├── app/                # App Router Pages
│   ├── components/         # UI Components (Auth, DiffViewer, Sidebar)
│   └── ...
├── server/                 # FastAPI Backend
│   ├── main.py             # API Endpoints, Auth, & AI Logic
│   ├── seed_faiss.py       # Vector DB Seeder Script
│   ├── faiss_index.bin     # Generated Vector Index
│   ├── users.db            # (Legacy) SQLite file (now using Supabase)
│   └── requirements.txt    # Python dependencies
├── start.sh                # Startup automation script
└── README.md               # This file
```

---

## 🛡️ Security Note

- **Passwords:** Never stored in plain text. We use **Bcrypt** hashing.
- **API Keys:** Stored in `.env` (server-side only).
- **History:** Stored client-side (LocalStorage) for privacy and speed.

---

*Built with ❤️ by Praveen*