import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/** Extract plain text from a DOCX buffer using mammoth */
async function extractDocxText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ''
}

/** Fire-and-forget: send document to Python backend for FAISS indexing */
async function indexInFaiss(docId: string, content: string, fileName: string): Promise<void> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/rag/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId, content, file_name: fileName }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!resp.ok) {
      const err = await resp.text()
      console.error(`[FAISS index] Backend error for ${docId}:`, err)
    } else {
      const data = await resp.json()
      console.log(`[FAISS index] ${docId} indexed — ${data.chunks_created} chunks`)
    }
  } catch (err) {
    console.warn(`[FAISS index] Backend unavailable for ${docId}:`, (err as Error).message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = (formData.get('userId') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name
    const fileType = fileName.split('.').pop()?.toUpperCase() || 'TXT'
    let extractedText = ''

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (fileType === 'PDF') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdf = require('pdf-parse')
        const data = await pdf(buffer)
        const parsed = (data.text || '').trim()
        if (parsed && !parsed.startsWith('%PDF-')) {
          extractedText = parsed
        } else {
          throw new Error('pdf-parse returned raw PDF markup instead of text')
        }
      } catch (pdfErr: any) {
        console.error('PDF parse error, trying ASCII fallback:', pdfErr.message)
        const rawString = buffer.toString('latin1')
        const textMatches = rawString.match(/[A-Za-z][A-Za-z0-9 ,.:;!?'"()\-\n\t]{8,}/g)
        const filtered = textMatches
          ? textMatches.filter(
              (t) => !/(endobj|endstream|stream|xref|startxref|BT|ET|Tf|Td|Tj|TJ|obj)/i.test(t)
            )
          : []
        extractedText = filtered.length > 0 ? filtered.join(' ') : 'Unable to parse PDF text.'
      }
    } else if (fileType === 'DOCX' || fileType === 'DOC') {
      extractedText = await extractDocxText(buffer)
      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract text from DOCX file. The file may be corrupted or image-only.' },
          { status: 422 }
        )
      }
    } else {
      try {
        extractedText = buffer.toString('utf-8')
      } catch {
        extractedText = buffer.toString('latin1')
      }
    }

    // Normalise whitespace
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

    const docId = `doc-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const filePath = `/uploads/${fileName}`
    const createdAt = new Date().toISOString()

    // Save document metadata + content to Supabase
    const supabase = await createClient()
    const { error: insertError } = await supabase
      .from('documents')
      .insert({
        id: docId,
        user_id: userId || undefined,
        file_name: fileName,
        file_type: fileType,
        file_path: filePath,
        content: extractedText,
        created_at: createdAt,
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: insertError.message || 'Failed to save document' }, { status: 500 })
    }

    // Kick off FAISS indexing in the background (non-blocking)
    indexInFaiss(docId, extractedText, fileName).catch(() => { /* already logged inside */ })

    return NextResponse.json({
      success: true,
      document: {
        id: docId,
        user_id: userId,
        file_name: fileName,
        file_type: fileType,
        file_path: filePath,
        content: extractedText,
        created_at: createdAt,
      },
    })
  } catch (err: any) {
    console.error('Upload document error:', err)
    return NextResponse.json({ error: err.message || 'Failed to upload document' }, { status: 500 })
  }
}
