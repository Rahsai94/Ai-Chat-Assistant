"use client"

import { useState, useEffect, useRef } from "react"
import { Paperclip, X, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Document {
  id: string
  filename: string
  status: string
  error?: string | null
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents")
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (e) {
      console.error("Failed to fetch documents", e)
    }
  }

  useEffect(() => {
    fetchDocuments()
    // Poll for status updates if any are pending
    const interval = setInterval(() => {
      setDocuments((prev) => {
        if (prev.some((d) => d.status === "PENDING")) {
          fetchDocuments()
        }
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.")
      return
    }

    if (!["application/pdf", "text/plain"].includes(file.type)) {
      setUploadError("Unsupported file type. Use PDF or TXT.")
      return
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (fileInputRef.current) {
         fileInputRef.current.value = ""
      }

      await fetchDocuments()
    } catch (err: any) {
      setUploadError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id))
      }
    } catch (e) {
      console.error("Failed to delete document", e)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2 p-2">
      <div className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5 text-sm border border-border/50 max-w-[200px]"
            title={doc.error || doc.filename}
          >
            {doc.status === "PENDING" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />
            ) : doc.status === "FAILED" ? (
               <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="truncate flex-1" style={{ maxWidth: '120px' }}>{doc.filename}</span>
            <button
              onClick={() => handleDelete(doc.id)}
              className="text-muted-foreground hover:text-foreground transition-colors ml-1"
              aria-label="Remove document"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {uploadError && <div className="text-xs text-destructive px-1">{uploadError}</div>}

      <div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="application/pdf,text/plain"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
          {isUploading ? "Uploading..." : "Attach Document (PDF/TXT)"}
        </Button>
      </div>
    </div>
  )
}
