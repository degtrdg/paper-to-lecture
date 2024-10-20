from pydantic import BaseModel
from typing import Optional, Dict

class QueryRequest(BaseModel):
    query_text: str
    n_results: int

class UpsertRequest(BaseModel):
    document: str
    doc_id: str
    metadata: Optional[Dict] = None