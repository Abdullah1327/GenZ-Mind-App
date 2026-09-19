'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Send,
  Bot,
  User,
  Sparkles,
  FileCode,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Document, ChatMessage } from '@/types'
import { toast } from 'sonner'

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to your Document Assistant! Upload any course notes, syllabus, or research papers (PDF, TXT, DOCX), select them on the left, and ask me any questions.',
      created_at: new Date().toISOString(),
    },
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load documents
  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const docs: Document[] = data || []
        setDocuments(docs)
        if (docs.length > 0 && !selectedDoc) {
          setSelectedDoc(docs[0])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setUploading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.id || 'anonymous')

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upload failed')
      }

      const newDoc: Document = data.document
      setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)])
      setSelectedDoc(newDoc)
      toast.success(`"${file.name}" uploaded and indexed!`)

      // Add a system assistant message acknowledging doc
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I have processed **${file.name}**. You can now ask questions, ask for key summaries, or extract flashcard concepts directly from this document!`,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to upload document.')
    } finally {
      setUploading(false)
      // reset file input
      e.target.value = ''
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    try {
      const supabase = createClient()
      await supabase.from('documents').eq('id', docId).delete()
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null)
      }
      toast.success('Document removed')
    } catch (e) {
      toast.error('Could not delete document')
    }
  }

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputQuery
    if (!q.trim()) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInputQuery('')
    setIsThinking(true)

    try {
      if (!selectedDoc) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: 'Please upload or select a document first so I can answer questions strictly grounded in your materials.',
            created_at: new Date().toISOString(),
          },
        ])
        setIsThinking(false)
        return
      }

      const res = await fetch('/api/documents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDoc.id,
          message: q.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to process question')
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error processing question')
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I encountered an issue analyzing "${selectedDoc?.file_name}": ${err.message}. Please try again or re-upload the document.`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-cyan-600" />
          Document Assistant
        </h1>
        <p className="text-slate-500 mt-1">
          Upload course materials and get instant, grounded AI answers and study notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Documents Manager (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Upload Study Materials</span>
              <span className="text-[11px] text-slate-400 font-normal">PDF, TXT, DOCX</span>
            </h2>

            <label className="border-2 border-dashed border-cyan-200 bg-cyan-50/40 hover:bg-cyan-50/80 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {uploading ? 'Processing Document...' : 'Click or drop file here'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Maximum file size: 10MB</p>
              <input
                type="file"
                accept=".pdf,.txt,.docx,.md"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Your Documents ({documents.length})</span>
            </h2>

            {loadingDocs ? (
              <div className="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isSelected
                              ? 'bg-cyan-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {doc.file_type}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDoc(doc.id)
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Chat Window (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[640px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Document Chat Assistant</p>
                <p className="text-xs text-slate-500">
                  {selectedDoc ? (
                    <span className="text-cyan-700 font-medium">
                      Active: {selectedDoc.file_name}
                    </span>
                  ) : (
                    'Select a document to ground responses'
                  )}
                </p>
              </div>
            </div>

            {selectedDoc && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                <CheckCircle2 className="w-3 h-3 text-cyan-600" /> RAG Grounded
              </span>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium flex-shrink-0">Suggested:</span>
            <button
              onClick={() => handleSendMessage('Summarize key concepts from this document')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-cyan-700 hover:border-cyan-300 transition-colors flex-shrink-0"
            >
              📝 Summarize concepts
            </button>
            <button
              onClick={() => handleSendMessage('Generate 3 study flashcards')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-cyan-700 hover:border-cyan-300 transition-colors flex-shrink-0"
            >
              ⚡ Flashcards
            </button>
            <button
              onClick={() => handleSendMessage('What are the main algorithms or steps discussed?')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-cyan-700 hover:border-cyan-300 transition-colors flex-shrink-0"
            >
              🔍 Key algorithms
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                      isAi ? 'bg-cyan-600' : 'gradient-bg'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isAi
                        ? 'bg-slate-50 border border-slate-100 text-slate-800'
                        : 'gradient-bg text-white shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-cyan-800 font-medium">
                        <ArrowUpRight className="w-3 h-3 text-cyan-600" />
                        <span>Source: {msg.sources[0].file_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isThinking && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                  Analyzing document content...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  selectedDoc
                    ? `Ask anything about "${selectedDoc.file_name}"...`
                    : 'Select a document to ask specific questions...'
                }
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isThinking}
                className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
