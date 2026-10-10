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

/**
 * Extract plain text from a PDF buffer using pdfjs-dist (legacy/Node-compatible build).
 * This handles real text-based PDFs correctly — including CVs, reports, etc.
 * Falls back to an empty string if extraction fails.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic ESM import — pdfjs-dist legacy build ships .mjs only
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as string)
    const { getDocument, GlobalWorkerOptions } = pdfjsLib as any

    // Disable worker thread (not needed / not available in Node.js server)
    GlobalWorkerOptions.workerSrc = ''

    const uint8 = new Uint8Array(buffer)
    const loadingTask = getDocument({
      data: uint8,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    })

    const pdfDoc = await loadingTask.promise
    const numPages: number = pdfDoc.numPages
    const pageTexts: string[] = []

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      // Each item is a TextItem or TextMarkedContent; only TextItem has `str`
      const pageText = (textContent.items as Array<{ str?: string }>)
        .map((item) => item.str ?? '')
        .join(' ')
      pageTexts.push(pageText)
    }

    return pageTexts.join('\n').trim()
  } catch (err: any) {
    console.error('[PDF extract] pdfjs-dist failed:', err?.message || err)
    return ''
  }
}

/** Extract plain text from a PPTX/PPT buffer using officeparser */
async function extractPptText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseOffice } = require('officeparser')
  // officeparser v8 returns an AST object — call .to('text') to get plain text
  const ast = await parseOffice(buffer, { fileType: 'pptx', outputErrorToConsole: false })
  const result = await ast.to('text')
  return (result?.value ?? result ?? '').toString().trim()
}


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
      // Use pdfjs-dist for reliable text extraction from all PDF types
      const pdfText = await extractPdfText(buffer)
      if (pdfText && pdfText.length > 50) {
        extractedText = pdfText
      } else {
        // Fallback: ASCII heuristic (catches some edge-case PDFs with embedded text streams)
        console.warn('[PDF extract] pdfjs-dist returned too little text, trying ASCII fallback')
        const rawString = buffer.toString('latin1')
        const textMatches = rawString.match(/[A-Za-z][A-Za-z0-9 ,.:;!?'"()\-\n\t]{8,}/g)
        const filtered = textMatches
          ? textMatches.filter(
              (t) => !/(endobj|endstream|stream|xref|startxref|BT|ET|Tf|Td|Tj|TJ|obj)/i.test(t)
            )
          : []
        extractedText = filtered.length > 0 ? filtered.join(' ') : ''
        if (!extractedText) {
          return NextResponse.json(
            { error: 'Could not extract text from this PDF. It may be scanned/image-only. Please try a different file.' },
            { status: 422 }
          )
        }
      }
    } else if (fileType === 'DOCX' || fileType === 'DOC') {
      extractedText = await extractDocxText(buffer)
      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract text from DOCX file. The file may be corrupted or image-only.' },
          { status: 422 }
        )
      }
    } else if (fileType === 'PPTX' || fileType === 'PPT') {
      try {
        extractedText = await extractPptText(buffer)
        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: 'Could not extract text from this PowerPoint file. It may be image-only slides.' },
            { status: 422 }
          )
        }
      } catch (pptErr: any) {
        console.error('PPTX parse error:', pptErr.message)
        return NextResponse.json(
          { error: 'Failed to read PowerPoint file. Please ensure it is a valid .pptx or .ppt file.' },
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

    const docId = crypto.randomUUID()
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
