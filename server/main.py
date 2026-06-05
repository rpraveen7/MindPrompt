import os
import json
import hashlib
import faiss
import numpy as np
import textstat
import tiktoken
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from litellm import completion
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url:
    print("✅ DATABASE_URL found.")
else:
    print("❌ DATABASE_URL NOT FOUND! History persistence will be disabled.")

app = FastAPI(title="MindPrompt API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE ---
def get_db_connection():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        return conn
    except Exception as e:
        print(f"❌ Database Connection Error: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if not conn:
        print("⚠️  Skipping DB init — no connection available.")
        return
    try:
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS prompt_history (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                key_hash TEXT NOT NULL,
                original_text TEXT NOT NULL,
                optimized_text TEXT NOT NULL,
                model_used TEXT,
                token_count_original INTEGER,
                token_count_optimized INTEGER,
                readability_original FLOAT,
                readability_optimized FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        ''')
        cur.execute(
            'CREATE INDEX IF NOT EXISTS idx_prompt_history_key_hash ON prompt_history(key_hash)'
        )
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database initialized.")
    except Exception as e:
        print(f"❌ Database Initialization Failed: {e}")

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

# --- RESOURCES ---
INDEX_FILE = "faiss_index.bin"
PROMPTS_JSON = "golden_prompts.json"
SYSTEM_PROMPT = """
You are a Senior Prompt Engineer and Logic Optimizer.
Your goal is to rewrite the user's raw prompt using the CO-STAR framework:

1. Context: Add necessary background (e.g., "You are an expert in...")
2. Objective: Define the specific goal clearly.
3. Style: Define the writing style (e.g., "Concise," "Academic," "Pythonic").
4. Tone: Define the attitude (e.g., "Professional," "Helpful").
5. Audience: Who is this for?
6. Response: Define the output format (e.g., "JSON," "Markdown," "Step-by-step").

RULES:
- Do NOT change the user's core intent.
- Fix ambiguity.
- If the prompt is for code, enforce "Best Practices" and "Comments".
- Return ONLY the rewritten prompt. Do not add conversational filler like "Here is your prompt".
"""

faiss_index = None
sentence_model = None
golden_prompts_data = []

def load_resources():
    global faiss_index, sentence_model, golden_prompts_data
    init_db()
    try:
        if os.path.exists(INDEX_FILE):
            print("Loading FAISS index...")
            faiss_index = faiss.read_index(INDEX_FILE)
            print("Loading Sentence Transformer...")
            sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            if os.path.exists(PROMPTS_JSON):
                with open(PROMPTS_JSON, "r") as f:
                    golden_prompts_data = json.load(f)
        else:
            print("FAISS index not found. Run seed_faiss.py to create it.")
    except Exception as e:
        print(f"Error loading resources: {e}")

@app.on_event("startup")
async def startup_event():
    load_resources()

# --- MODELS ---
class OptimizeRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gemini/gemini-flash-latest"

class Metrics(BaseModel):
    token_count: int
    readability_score: float

class OptimizeResponse(BaseModel):
    original_prompt: str
    optimized_prompt: str
    original_metrics: Metrics
    optimized_metrics: Metrics
    similar_prompts: List[Dict[str, str]]

class SimulateRequest(BaseModel):
    original_prompt: str
    optimized_prompt: str
    model: Optional[str] = "gemini/gemini-flash-latest"

class SimulateResponse(BaseModel):
    original_output: str
    optimized_output: str

class HistoryItemResponse(BaseModel):
    id: str
    original_text: str
    optimized_text: str
    model_used: Optional[str]
    token_count_original: int
    token_count_optimized: int
    readability_original: float
    readability_optimized: float
    created_at: str

# --- HELPERS ---
def calculate_metrics(text: str) -> Metrics:
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = len(encoding.encode(text))
        readability = textstat.flesch_kincaid_grade(text)
        return Metrics(token_count=tokens, readability_score=readability)
    except Exception:
        return Metrics(token_count=0, readability_score=0.0)

def search_similar_prompts(query: str, k: int = 3) -> List[Dict[str, str]]:
    if not faiss_index or not sentence_model:
        return []
    try:
        query_vector = sentence_model.encode([query])
        D, I = faiss_index.search(query_vector, k)
        results = []
        for idx in I[0]:
            if 0 <= idx < len(golden_prompts_data):
                results.append(golden_prompts_data[idx])
        return results
    except Exception as e:
        print(f"❌ Search error: {e}")
        return []

def save_to_history(key_hash: str, original: str, optimized: str, model: str,
                    orig_metrics: Metrics, opt_metrics: Metrics):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO prompt_history
                (key_hash, original_text, optimized_text, model_used,
                 token_count_original, token_count_optimized,
                 readability_original, readability_optimized)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (key_hash, original, optimized, model,
              orig_metrics.token_count, opt_metrics.token_count,
              orig_metrics.readability_score, opt_metrics.readability_score))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"⚠️  Failed to save history: {e}")

# --- ENDPOINTS ---

@app.post("/optimize", response_model=OptimizeResponse)
async def optimize_prompt(req: OptimizeRequest, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(
            status_code=401,
            detail="No Gemini API key provided. Add your key in the settings panel."
        )

    orig_metrics = calculate_metrics(req.prompt)

    try:
        response = completion(
            model=req.model,
            api_key=x_gemini_api_key,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": req.prompt}
            ]
        )
        optimized_text = response.choices[0].message.content
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

    opt_metrics = calculate_metrics(optimized_text)
    similar = search_similar_prompts(req.prompt)

    key_hash = hash_api_key(x_gemini_api_key)
    save_to_history(key_hash, req.prompt, optimized_text, req.model or "gemini/gemini-flash-latest",
                    orig_metrics, opt_metrics)

    return OptimizeResponse(
        original_prompt=req.prompt,
        optimized_prompt=optimized_text,
        original_metrics=orig_metrics,
        optimized_metrics=opt_metrics,
        similar_prompts=similar
    )

@app.post("/simulate", response_model=SimulateResponse)
async def simulate_prompt(req: SimulateRequest, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(
            status_code=401,
            detail="No Gemini API key provided. Add your key in the settings panel."
        )

    def run_completion(prompt: str) -> str:
        resp = completion(
            model=req.model,
            api_key=x_gemini_api_key,
            messages=[{"role": "user", "content": prompt}]
        )
        # content can be None when Gemini blocks a response via safety filters
        content = resp.choices[0].message.content
        if content is None:
            return "[Response blocked by content safety filter]"
        return content

    try:
        original_output = run_completion(req.original_prompt)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Simulation error (original prompt): {str(e)}")

    try:
        optimized_output = run_completion(req.optimized_prompt)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Simulation error (optimized prompt): {str(e)}")

    return SimulateResponse(
        original_output=original_output,
        optimized_output=optimized_output
    )

@app.get("/history", response_model=List[HistoryItemResponse])
async def get_history(x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(status_code=401, detail="No Gemini API key provided.")
    key_hash = hash_api_key(x_gemini_api_key)
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT id::text, original_text, optimized_text, model_used,
                   COALESCE(token_count_original, 0) AS token_count_original,
                   COALESCE(token_count_optimized, 0) AS token_count_optimized,
                   COALESCE(readability_original, 0.0) AS readability_original,
                   COALESCE(readability_optimized, 0.0) AS readability_optimized,
                   created_at::text
            FROM prompt_history
            WHERE key_hash = %s
            ORDER BY created_at DESC
            LIMIT 50
        ''', (key_hash,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"History fetch error: {e}")
        return []

@app.delete("/history/{item_id}")
async def delete_history_item(item_id: str, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(status_code=401, detail="No Gemini API key provided.")
    key_hash = hash_api_key(x_gemini_api_key)
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database unavailable.")
    try:
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM prompt_history WHERE id = %s AND key_hash = %s',
            (item_id, key_hash)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "MindPrompt API is running."}
