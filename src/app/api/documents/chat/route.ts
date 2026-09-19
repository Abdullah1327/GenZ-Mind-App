import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// ─── Binary / corrupt content detection ──────────────────────────────────────

function isBinaryContent(text: string): boolean {
  const sample = text.slice(0, 200)
  let nonPrintable = 0
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i)
    if (code < 9 || (code > 13 && code < 32) || code === 65533) nonPrintable++
  }
  return nonPrintable / sample.length > 0.1
}

function isRawPdfMarkup(text: string): boolean {
  const trimmed = text.trimStart()
  return trimmed.startsWith('%PDF-') && /\bendobj\b/.test(text.slice(0, 1000))
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, message } = body

    if (!documentId || !message) {
      return NextResponse.json(
        { error: 'documentId and message are required' },
        { status: 400 }
      )
    }

    // Fetch document from Supabase
    const supabase = await createClient()
    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const content: string = doc.content || ''

    // Guard: empty content
    if (!content.trim()) {
      return NextResponse.json({
        answer: `The document **${doc.file_name}** does not appear to contain extractable text. Please re-upload the file.`,
        sources: [],
      })
    }

    // Guard: corrupted binary / raw PDF markup
    if (isBinaryContent(content) || isRawPdfMarkup(content)) {
      return NextResponse.json({
        answer: `⚠️ **${doc.file_name}** could not be read correctly — the file content was not properly extracted during upload. Please **delete and re-upload** this document.`,
        sources: [],
      })
    }

    // ── Call Python FAISS backend ──────────────────────────────────────────────
    try {
      const backendResp = await fetch(`${BACKEND_URL}/api/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          message,
          file_name: doc.file_name,
          content,
        }),
        signal: AbortSignal.timeout(45_000),
      })

      if (backendResp.ok) {
        const data = await backendResp.json()
        return NextResponse.json({
          answer: data.answer,
          sources: (data.sources || []).map((s: { file_name: string; snippet: string; score: number }) => ({
            file_name: s.file_name,
            snippet: s.snippet,
            score: s.score,
          })),
        })
      }

      const errBody = await backendResp.json().catch(() => ({}))
      console.error('[RAG backend] error:', backendResp.status, errBody)
    } catch (backendErr) {
      console.warn('[RAG backend] unreachable — using local BM25 fallback:', (backendErr as Error).message)
    }

    // ── Local BM25 fallback (when Python backend is down) ─────────────────────
    return await localBm25Fallback(doc, content, message)
  } catch (err: any) {
    console.error('RAG chat error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to process RAG chat' },
      { status: 500 }
    )
  }
}

// ─── Local BM25 fallback (no Python backend required) ────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'by', 'from', 'about', 'into', 'through', 'after', 'before',
  'what', 'where', 'when', 'who', 'whom', 'which', 'why', 'how', 'can', 'could', 'should',
  'would', 'will', 'do', 'does', 'did', 'have', 'has', 'had', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'my', 'your', 'his', 'her', 'their', 'our', 'this', 'that', 'these',
  'those', 'be', 'been', 'being', 'me', 'us', 'him', 'them', 'tell', 'explain', 'give',
])

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []
  for (const para of paragraphs) {
    if (para.length <= 500) {
      chunks.push(para)
    } else {
      const lines = para.split('\n').map((l) => l.trim()).filter(Boolean)
      let cur = ''
      for (const l of lines) {
        if ((cur + '\n' + l).length > 400 && cur.length > 0) {
          chunks.push(cur.trim())
          cur = l
        } else {
          cur += '\n' + l
        }
      }
      if (cur.trim()) chunks.push(cur.trim())
    }
  }
  if (chunks.length === 0) chunks.push(text)
  return chunks
}

/** Fallback scoring + Groq LLM generation */
async function localBm25Fallback(
  doc: { file_name: string },
  content: string,
  message: string
) {
  const chunks = chunkText(content)
  const keywords = extractKeywords(message)
  const lowerMsg = message.toLowerCase()

  const scored = chunks.map((chunk, idx) => {
    const lowerChunk = chunk.toLowerCase()
    let score = 0

    if (lowerMsg.length > 5 && lowerChunk.includes(lowerMsg)) score += 100

    const words = lowerMsg.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean)
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`
      if (bigram.length > 4 && !STOP_WORDS.has(words[i]) && lowerChunk.includes(bigram)) {
        score += 30
      }
    }

    for (const kw of keywords) {
      const tf = (lowerChunk.match(new RegExp(kw, 'g')) || []).length
      if (tf > 0) score += 10 + Math.min(tf * 5, 20)
    }

    if ((lowerMsg.includes('duration') || lowerMsg.includes('time') || lowerMsg.includes('how long')) &&
        (lowerChunk.includes('week') || lowerChunk.includes('month') || lowerChunk.includes('hour') || lowerChunk.includes('duration'))) {
      score += 50
    }

    return { chunk, idx, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const topChunks = scored.slice(0, 4).filter(c => c.score > 0)
  const selectedChunks = topChunks.length > 0 ? topChunks : [scored[0]]
  const best = selectedChunks[0]

  let groqKey = process.env.RAG_GROQ_KEY || process.env.GROQ_API_KEY || ''
  if (groqKey.startsWith('hergsk_')) {
    groqKey = groqKey.slice(3)
  }
  console.log('[RAG fallback] GROQ key valid:', groqKey.startsWith('gsk_'), '| length:', groqKey.length)

  if (groqKey && groqKey.startsWith('gsk_') && groqKey.length > 10) {
    const modelsToTry = ['openai/gpt-oss-20b', 'groq/compound-mini']

    const contextText = content.length < 15000
      ? content
      : selectedChunks.map((c, i) => `[Excerpt ${i + 1}]:\n${c.chunk}`).join('\n\n')

    const prompt = `You are the GenZ Mind AI Document Assistant.
Answer the user's question accurately, concisely, and strictly based on the following document context from "${doc.file_name}".
If the information is in the document, answer directly with the exact facts, code examples, steps, and details.
Do not make up information that is not present in the document.

Document Context:
"""
${contextText}
"""

User Question: ${message}

Helpful Answer:`

    for (const model of modelsToTry) {
      try {
        console.log(`[RAG fallback] Trying Groq model: ${model}`)
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an accurate, helpful AI document tutor. Answer based strictly on the provided document context. If the document contains code examples, include them.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(25_000),
        })

        if (res.ok) {
          const groqData = await res.json()
          const aiAnswer = groqData.choices?.[0]?.message?.content
          if (aiAnswer) {
            console.log(`[RAG fallback] Groq answered successfully with ${model}`)
            return NextResponse.json({
              answer: aiAnswer,
              sources: selectedChunks.map(c => ({
                file_name: doc.file_name,
                snippet: c.chunk.slice(0, 160) + '...',
                score: c.score,
              })),
            })
          }
        } else {
          const errBody = await res.text().catch(() => 'unknown')
          console.error(`[RAG fallback] Groq model ${model} returned ${res.status}:`, errBody)
        }
      } catch (llmErr: any) {
        console.error(`[RAG fallback] Groq model ${model} threw:`, llmErr?.message || llmErr)
      }
    }
  }

  const answer = best && best.score > 0
    ? `According to **${doc.file_name}**:\n\n${best.chunk.trim()}`
    : `I searched **${doc.file_name}** but could not find a direct answer to "${message}".\n\nHere is an excerpt from the document:\n\n> "${best?.chunk?.slice(0, 300).trim()}..."`

  return NextResponse.json({
    answer,
    sources: [{ file_name: doc.file_name, snippet: best?.chunk?.slice(0, 150) + '...', score: 0 }],
  })
}
