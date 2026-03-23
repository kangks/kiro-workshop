---
inclusion: manual
---

# RAG Pipeline Standards

Best practices for building and maintaining Retrieval-Augmented Generation pipelines in production LLM applications.

## Chunking Strategy

- Choose chunk size based on the embedding model's context window and the retrieval use case (250-1000 tokens is typical)
- Use semantic boundaries (paragraphs, sections, sentences) over fixed-size windows when possible
- Apply overlap (10-20% of chunk size) to preserve context across boundaries
- Store chunk metadata: source document, position index, creation timestamp, content hash
- Implement deduplication — identical or near-identical chunks waste storage and skew retrieval

## Embedding Quality

- Select embedding models appropriate for the domain (general-purpose vs. domain-specific)
- Pin embedding model versions — changing models invalidates all existing vectors
- If you change the embedding model, re-embed the entire corpus. Partial re-embedding creates inconsistent similarity scores
- Batch embedding calls where possible to reduce latency and API costs
- Validate embeddings are non-zero before storing — empty vectors indicate extraction or model failures

## Retrieval Quality

- Use cosine similarity as the default distance metric unless domain-specific evaluation shows otherwise
- Implement diverse retrieval: group results by source and cap per-source results to prevent single-document dominance
- Set a minimum similarity threshold — don't inject low-relevance chunks into prompts
- Evaluate retrieval quality with metrics: Mean Reciprocal Rank (MRR), Recall@k, Precision@k
- Log retrieved chunks per query for debugging and quality monitoring

## Poisoning Prevention

- Validate document sources before ingestion — implement allowlists for trusted origins
- Scan ingested content for injection payloads (prompt injection patterns, encoded instructions)
- Track provenance: every chunk must link back to its source document and ingestion timestamp
- Implement access controls on the chunk ingestion API — don't allow anonymous writes to the vector store
- Periodically audit vector store contents for anomalous or malicious entries

## Context Injection

- Clearly delimit retrieved context from user input in the prompt (use XML tags, markdown headers, or role separation)
- Truncate context to fit within the model's context window — leave room for the system prompt and expected output
- Order chunks by relevance score descending in the prompt
- Include source attribution metadata so the model can cite its sources
- Never inject raw retrieved text without sanitization — treat it as untrusted input

## Vector Store Operations

- Auto-create collections/indexes on first write with explicit schema (dimension, distance metric)
- Use UUIDs for point/document IDs — never sequential integers
- Implement bulk deletion by source/metadata filter for document removal
- Handle vector store unavailability gracefully — degrade to non-RAG responses rather than failing entirely
- Monitor collection size and query latency as the corpus grows
