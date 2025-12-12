import os
import json
import faiss
import numpy as np
import textstat
import tiktoken
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from litellm import completion
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import JWTError, jwt

load_dotenv()

# DEBUG: Check if key is loaded
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    print(f"✅ GEMINI_API_KEY loaded: {api_key[:5]}...{api_key[-4:]}")
else:
    print("❌ GEMINI_API_KEY NOT FOUND in environment variables!")

# Check DB URL
db_url = os.getenv("DATABASE_URL")
if db_url:
    print("✅ DATABASE_URL found.")
else:
    print("❌ DATABASE_URL NOT FOUND! Auth will fail.")

app = FastAPI(title="MindPrompt API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH CONFIGURATION ---
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS_IN_PROD" # In prod, load from .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30000 # Long session for demo

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- DATABASE (PostgreSQL) ---
def get_db_connection():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        return conn
    except Exception as e:
        print(f"❌ Database Connection Error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Create users table if not exists
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        ''')
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database initialized (users table ready).")
    except Exception as e:
        print(f"❌ Database Initialization Failed: {e}")

# --- AUTH HELPERS ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- AUTH MODELS ---
class UserAuth(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- EXISTING LOGIC ---
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

# Load FAISS and Model (Global state)
faiss_index = None
sentence_model = None
golden_prompts_data = []

def load_resources():
    global faiss_index, sentence_model, golden_prompts_data
    init_db() # Initialize DB (Postgres)
    try:
        # Only load if files exist
        if os.path.exists(INDEX_FILE):
            print("Loading FAISS index...")
            faiss_index = faiss.read_index(INDEX_FILE)
            print("Loading Sentence Transformer...")
            sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            if os.path.exists(PROMPTS_JSON):
                with open(PROMPTS_JSON, "r") as f:
                    golden_prompts_data = json.load(f)
        else:
            print("FAISS index not found. Skipping vector search init. Run seed_faiss.py to create it.")
    except Exception as e:
        print(f"Error loading resources: {e}")

@app.on_event("startup")
async def startup_event():
    load_resources()

# Pydantic Models
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

# Helper Functions
def calculate_metrics(text: str) -> Metrics:
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = len(encoding.encode(text))
        readability = textstat.flesch_kincaid_grade(text)
        return Metrics(token_count=tokens, readability_score=readability)
    except Exception:
        # Fallback if metrics fail
        return Metrics(token_count=0, readability_score=0.0)

def search_similar_prompts(query: str, k: int = 3) -> List[Dict[str, str]]:
    if not faiss_index or not sentence_model:
        print("❌ Search failed: FAISS index or model not loaded.")
        return []
    
    try:
        print(f"🔎 Searching for: '{query[:20]}...'")
        query_vector = sentence_model.encode([query])
        D, I = faiss_index.search(query_vector, k)
        
        results = []
        for idx in I[0]:
            if idx < len(golden_prompts_data) and idx >= 0:
                results.append(golden_prompts_data[idx])
        
        print(f"✅ Found {len(results)} similar prompts.")
        return results
    except Exception as e:
        print(f"❌ Search error: {e}")
        return []

# --- AUTH ENDPOINTS ---

@app.post("/auth/signup", response_model=Token)
async def signup(user: UserAuth):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # DEBUG: Inspect password
        print(f"🔐 Signup Password Length: {len(user.password)}")
        
        hashed_pw = get_password_hash(user.password)
        cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (user.username, hashed_pw))
        conn.commit()
        cur.close()
        conn.close()
        
        # Auto-login on signup
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
            
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=400, detail="Username already taken")
    except Exception as e:
        print(f"Signup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login", response_model=Token)
async def login(user: UserAuth):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE username = %s", (user.username,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row or not verify_password(user.password, row[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/forgot-password")
async def forgot_password(user: Dict[str, str]):
    # Mock implementation - In production, use SendGrid/AWS SES
    username = user.get('username')
    print(f"📧 [MOCK EMAIL] Reset link sent to email associated with user: {username}")
    return {"message": "If an account exists, a reset link has been sent."}

# --- APP ENDPOINTS ---

@app.post("/optimize", response_model=OptimizeResponse)
async def optimize_prompt(req: OptimizeRequest):
    # 1. Calculate Initial Metrics
    orig_metrics = calculate_metrics(req.prompt)
    
    # 2. Call LLM for Optimization
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
             print("Warning: GEMINI_API_KEY not found in environment")

        # Using litellm to support various providers
        response = completion(
            model=req.model,
            api_key=api_key,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": req.prompt}
            ]
        )
        optimized_text = response.choices[0].message.content
    except Exception as e:
        import traceback
        print(f"❌ LLM Error Details:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

    # 3. Calculate Final Metrics
    opt_metrics = calculate_metrics(optimized_text)
    
    # 4. Search Similar Prompts
    similar = search_similar_prompts(req.prompt)
    
    return OptimizeResponse(
        original_prompt=req.prompt,
        optimized_prompt=optimized_text,
        original_metrics=orig_metrics,
        optimized_metrics=opt_metrics,
        similar_prompts=similar
    )

@app.post("/simulate", response_model=SimulateResponse)
async def simulate_prompt(req: SimulateRequest):
    try:
        resp_orig = completion(
            model=req.model,
            messages=[{"role": "user", "content": req.original_prompt}]
        )
        resp_opt = completion(
            model=req.model,
            messages=[{"role": "user", "content": req.optimized_prompt}]
        )
        
        return SimulateResponse(
            original_output=resp_orig.choices[0].message.content,
            optimized_output=resp_opt.choices[0].message.content
        )
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Simulation Error: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "MindPrompt API is running."}