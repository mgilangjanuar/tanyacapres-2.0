from numpy import ndarray
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('intfloat/multilingual-e5-large')

def create_embedding(doc: str | list[str]) -> ndarray:
    return model.encode(doc)
