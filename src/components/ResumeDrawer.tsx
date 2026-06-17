import {
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const inputCls =
  'w-full rounded-button border border-border bg-canvas px-3 py-2 text-[13px] text-ink ' +
  'placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent ' +
  'focus:ring-offset-1 transition-shadow'

// ---------------------------------------------------------------------------
// PDF preview dialog
// ---------------------------------------------------------------------------

interface PreviewProps {
  resumeId: Id<'resumes'>
  label: string
  onClose: () => void
}

function PdfPreviewDialog({ resumeId, label, onClose }: PreviewProps) {
  const url = useQuery(api.resumes.getUrl, { resumeId })
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    function handleCancel(e: Event) {
      e.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom
    if (outside) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label={`Preview: ${label}`}
      className="w-full max-w-3xl h-[90vh] bg-canvas rounded-card border border-border shadow-card-drag flex flex-col outline-none"
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-[15px] font-semibold text-ink truncate">{label}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-button text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {url ? (
            <iframe
              src={url}
              title={label}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[13px] text-ink-muted">
              Loading…
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}

// ---------------------------------------------------------------------------
// Resume drawer
// ---------------------------------------------------------------------------

interface Props {
  open: boolean
  onClose: () => void
}

export function ResumeDrawer({ open, onClose }: Props) {
  const resumes = useQuery(api.resumes.list)
  const generateUploadUrl = useMutation(api.resumes.generateUploadUrl)
  const createResume = useMutation(api.resumes.create)
  const removeResume = useMutation(api.resumes.remove)
  const updateLabel = useMutation(api.resumes.updateLabel)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<Id<'resumes'> | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [previewId, setPreviewId] = useState<Id<'resumes'> | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && !previewId) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, previewId])

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed')
      const { storageId } = await res.json()
      const label = file.name.replace(/\.pdf$/i, '')
      await createResume({ storageId, filename: file.name, label })
    } catch {
      setUploadError('Upload failed — please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function startEdit(id: Id<'resumes'>, currentLabel: string) {
    setEditingId(id)
    setDraftLabel(currentLabel)
  }

  async function commitLabel() {
    if (!editingId) return
    const trimmed = draftLabel.trim()
    if (trimmed) await updateLabel({ id: editingId, label: trimmed })
    setEditingId(null)
  }

  function handleLabelKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitLabel()
    if (e.key === 'Escape') setEditingId(null)
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const previewResume = resumes?.find(r => r._id === previewId)

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-ink/20 z-20" onClick={onClose} aria-hidden="true" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resumes"
        className={[
          'fixed top-0 right-0 h-full w-[400px] bg-card z-30',
          'flex flex-col shadow-card-drag border-l border-border',
          'transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-[15px] font-semibold text-ink">Resumes</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-button text-ink-muted hover:text-ink hover:bg-column transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload PDF resume"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-2.5 rounded-button border-2 border-dashed border-border text-[13px] font-medium text-ink-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {uploading ? 'Uploading…' : '+ Upload PDF'}
            </button>
            {uploadError && (
              <p className="mt-2 text-[12px] text-stage-rejected">{uploadError}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {resumes === undefined && (
              <p className="text-[13px] text-ink-muted/60 text-center py-6">Loading…</p>
            )}
            {resumes?.length === 0 && (
              <p className="text-[13px] text-ink-muted/60 text-center py-6">
                No resumes yet — upload a PDF to get started.
              </p>
            )}
            {resumes?.map(resume => (
              <div
                key={resume._id}
                className="flex items-start gap-3 bg-canvas border border-border rounded-card px-4 py-3"
              >
                <div
                  className="w-8 h-8 shrink-0 rounded flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                  style={{ backgroundColor: 'var(--color-stage-rejected)' }}
                  aria-hidden="true"
                >
                  PDF
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === resume._id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={draftLabel}
                      onChange={e => setDraftLabel(e.target.value)}
                      onBlur={commitLabel}
                      onKeyDown={handleLabelKeyDown}
                      className={inputCls}
                      aria-label="Resume label"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(resume._id, resume.label)}
                      className="text-[13px] font-medium text-ink text-left hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded truncate max-w-full block"
                      title="Click to rename"
                    >
                      {resume.label}
                    </button>
                  )}
                  <p className="text-[11px] text-ink-muted/70 mt-0.5 truncate">
                    {resume.filename} · {formatDate(resume.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewId(resume._id)}
                    aria-label={`Preview ${resume.label}`}
                    className="text-[12px] text-ink-muted/60 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded px-1 py-1"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => removeResume({ id: resume._id })}
                    aria-label={`Delete ${resume.label}`}
                    className="text-ink-muted/50 hover:text-stage-rejected transition-colors text-[16px] leading-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewId && previewResume && (
        <PdfPreviewDialog
          resumeId={previewId}
          label={previewResume.label}
          onClose={() => setPreviewId(null)}
        />
      )}
    </>
  )
}
