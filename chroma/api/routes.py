from fastapi import APIRouter, Depends
from models.schemas import QueryRequest, UpsertRequest
from services.chroma_service import ChromaService

router = APIRouter()

@router.post("/query")
def query_documents(request: QueryRequest, chroma_service: ChromaService = Depends(ChromaService)):
    results = chroma_service.query(request.query_text, request.n_results)
    return results

@router.post("/upsert")
def upsert_document(request: UpsertRequest, chroma_service: ChromaService = Depends(ChromaService)):
    chroma_service.upsert(request.document, request.doc_id, request.metadata)
    return {"message": "Document upserted successfully"}

"""
[
    {
        "OutputKey": "ServerIp",
        "OutputValue": "18.215.148.95",
        "Description": "IP address of the Chroma server"
    }
]

"StackId": "arn:aws:cloudformation:us-east-1:680171539607:stack/my-chroma-stack/de108050-8e61-11ef-a25a-0affcc82041f"
"""