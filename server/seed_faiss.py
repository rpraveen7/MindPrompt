import os
import faiss
import numpy as np
import requests
import csv
import json
from sentence_transformers import SentenceTransformer

# Constants
DATASET_URL = "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv"
INDEX_FILE = "faiss_index.bin"
PROMPTS_FILE = "golden_prompts.csv"
PROMPTS_JSON = "golden_prompts.json"

def download_dataset():
    print(f"Downloading dataset from {DATASET_URL}...")
    response = requests.get(DATASET_URL)
    response.raise_for_status()
    with open(PROMPTS_FILE, "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Dataset downloaded.")

def build_index():
    print("Loading Sentence Transformer model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    prompts_data = []
    prompts_text = []
    
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader) # Skip header
        for row in reader:
            if len(row) >= 2:
                # row[0] is 'act' (persona), row[1] is 'prompt'
                item = {"act": row[0], "prompt": row[1]}
                prompts_data.append(item)
                prompts_text.append(row[1])
    
    print(f"Encoding {len(prompts_text)} prompts...")
    embeddings = model.encode(prompts_text)
    
    d = embeddings.shape[1]
    index = faiss.IndexFlatL2(d)
    index.add(embeddings)
    
    print(f"Saving index to {os.path.abspath(INDEX_FILE)}...")
    faiss.write_index(index, INDEX_FILE)
    
    # Save the structured data for retrieval
    print(f"Saving metadata to {os.path.abspath(PROMPTS_JSON)}...")
    with open(PROMPTS_JSON, "w", encoding="utf-8") as f:
        json.dump(prompts_data, f, indent=2)
            
    print("Done.")

if __name__ == "__main__":
    download_dataset()
    build_index()
