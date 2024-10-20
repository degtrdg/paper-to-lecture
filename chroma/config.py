import chromadb

chroma_client = None
collection = None

def init_chroma():
    global chroma_client, collection
    chroma_client = chromadb.Client()
    collection = chroma_client.get_or_create_collection(name="my_collection")

    collection.upsert(
        documents=[
            "This is a document about pineapple",
            "This is a document about oranges"
        ],
        ids=["id1", "id2"]
    )
