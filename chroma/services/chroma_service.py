import chromadb
from chromadb.config import Settings
class ChromaService:
    def __init__(self):
        self.client = chromadb.HttpClient(host="18.215.148.95", port = 8000, settings=Settings(allow_reset=True, anonymized_telemetry=False))
        self.collection = self.client.get_or_create_collection("sample_collection")

    def query(self, query_text: str, n_results: int):
        results = self.collection.query(
            query_texts=["This is a query document"],
            n_results=n_results
        )
        return results

    def upsert(self, document: str, doc_id: str, metadata: dict = None):
        self.collection.upsert(
            documents=[document],
            ids=[doc_id],
            metadatas=[metadata] if metadata else None
        )