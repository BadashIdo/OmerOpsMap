from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import WebBaseLoader , RecursiveUrlLoader
from langchain_openai import OpenAIEmbeddings
import os
import shutil
from bs4 import BeautifulSoup as Soup

load_dotenv()

PERSIST_DIRECTORY = "./.chroma"

# --- Helper function to clean HTML during recursive crawling ---
def simple_extractor(html):
    soup = Soup(html, "html.parser")
    # Remove irrelevant elements like scripts, styles, navbars, and footers
    for element in soup(["script", "style", "nav", "footer"]):
        element.extract()
    return soup.get_text(separator=" ", strip=True)

# --- 1. Clean up existing VectorStore (DB) ---
# This ensures we start fresh every time we run ingestion
if os.path.exists(PERSIST_DIRECTORY):
    shutil.rmtree(PERSIST_DIRECTORY)
    print(f"🧹 Deleted existing directory: {PERSIST_DIRECTORY}")
else:
    print(f"🆕 Creating new directory: {PERSIST_DIRECTORY}")

# --- 2. Define Data Sources ---

# Group A: Static single pages (e.g., Articles, specific Wikipedia pages)
# We only want the specific page content here, no crawling.
static_urls = [
    "https://he.wikipedia.org/wiki/%D7%A2%D7%95%D7%9E%D7%A8_(%D7%99%D7%99%D7%A9%D7%95%D7%91)",
    "https://he.wikipedia.org/wiki/%D7%97%D7%98%D7%99%D7%91%D7%AA_%D7%94%D7%A0%D7%92%D7%91",
]

# Group B: Recursive crawling (Omer website)
# We want to explore the website to a certain depth.
omer_url = "https://www.omer.muni.il/%D7%94%D7%99%D7%99%D7%A9%D7%95%D7%91-%D7%A2%D7%95%D7%9E%D7%A8/"

all_docs = []

# --- 3. Execute Loading ---

# Load Static Pages
print(f"📄 Loading {len(static_urls)} static pages...")
for url in static_urls:
    loader = WebBaseLoader(url)
    docs = loader.load()
    all_docs.extend(docs)
    print(f"   - Loaded: {url}")

# Load Omer Website (Recursive)
print(f"🌍 Crawling Omer website recursively...")
omer_loader = RecursiveUrlLoader(
    url=omer_url,
    max_depth=3,  # Depth 2: Home page + direct links. Increase if needed.
    extractor=simple_extractor,
    exclude_dirs=["wp-content", "wp-includes", "wp-json"], # Ignore technical WordPress directories
    timeout=10
)
omer_docs = omer_loader.load()
print(f"Found {len(omer_docs)} pages in Omer website.")
all_docs.extend(omer_docs)

# --- 4. Text Splitting ---
print(f"✂️  Splitting text...")
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=200, 
    chunk_overlap=40
)
doc_splits = text_splitter.split_documents(all_docs)

# --- 5. Indexing / Saving to VectorStore ---
print(f"💾 Saving {len(doc_splits)} chunks to VectorStore...")
vectorstore = Chroma.from_documents(
    documents=doc_splits,
    collection_name="rag-chroma",
    embedding=OpenAIEmbeddings(),
    persist_directory=PERSIST_DIRECTORY,
)

print("✅ Ingestion complete! Agent is ready.")

retriever = Chroma(
    collection_name="rag-chroma",
    persist_directory="./.chroma",
    embedding_function=OpenAIEmbeddings(),
).as_retriever()