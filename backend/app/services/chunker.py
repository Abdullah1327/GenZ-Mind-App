"""
Text chunking utilities for RAG.

Uses an aggregation sliding window that packs paragraphs and sentences into
coherent semantic chunks of ~600-800 characters with overlap.
"""
from __future__ import annotations

import re
from typing import List


def chunk_text(
    text: str,
    chunk_size: int = 700,
    chunk_overlap: int = 150,
) -> List[str]:
    """
    Split *text* into coherent overlapping chunks of roughly *chunk_size* characters.
    Aggregates short paragraphs and lines together to preserve semantic context.
    """
    clean_text = text.replace('\r\n', '\n').strip()
    if not clean_text:
        return []

    # If the whole text is small enough, return it as a single chunk
    if len(clean_text) <= chunk_size:
        return [clean_text]

    # Split into raw paragraphs/blocks
    raw_blocks = [b.strip() for b in re.split(r'\n{2,}', clean_text) if b.strip()]
    if not raw_blocks:
        raw_blocks = [l.strip() for l in clean_text.split('\n') if l.strip()]

    chunks: List[str] = []
    current_chunk = ""

    for block in raw_blocks:
        # If block itself is huge, split by sentences
        if len(block) > chunk_size:
            sentences = re.split(r'([.!?\n]+(?:\s+|$))', block)
            temp_sent = ""
            for i in range(0, len(sentences), 2):
                sent_part = sentences[i] + (sentences[i + 1] if i + 1 < len(sentences) else "")
                sent_text = sent_part.strip()
                if not sent_text:
                    continue

                if len(current_chunk) + len(sent_text) + 1 <= chunk_size:
                    current_chunk = (current_chunk + " " + sent_text).strip()
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                        # Carry over overlap
                        overlap_start = max(0, len(current_chunk) - chunk_overlap)
                        current_chunk = current_chunk[overlap_start:].strip()
                    current_chunk = (current_chunk + " " + sent_text).strip()
            continue

        # Normal block aggregation
        delimiter = "\n\n" if current_chunk else ""
        candidate = current_chunk + delimiter + block

        if len(candidate) <= chunk_size:
            current_chunk = candidate
        else:
            if current_chunk:
                chunks.append(current_chunk)
                overlap_start = max(0, len(current_chunk) - chunk_overlap)
                current_chunk = (current_chunk[overlap_start:].strip() + "\n\n" + block).strip()
            else:
                current_chunk = block

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Final cleanup & deduplication
    result: List[str] = []
    seen = set()
    for c in chunks:
        c_clean = c.strip()
        if c_clean and len(c_clean) > 20 and c_clean not in seen:
            seen.add(c_clean)
            result.append(c_clean)

    return result if result else [clean_text[:chunk_size]]
