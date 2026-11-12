import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadManyReceipts, processPages, saveReceipt } from '../api/receipts.js'
import { CATEGORIES, normalizeCategory } from '../constants/categories.js'
import { formatINR } from '../utils/format.js'

const MAX_FILES = 10
const MAX_BYTES = 10 * 1024 * 1024 // the server rejects anything larger

// ── helpers ──────────────────────────────────────────────────────────────

function errorMessage(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) return detail.map((d) => d.msg || String(d)).join(' ')
  if (err?.response?.status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (err?.code === 'ECONNABORTED') return 'This is taking too long. Check your connection and try again.'
  return fallback
}

function isImage(file) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
}

/** Gallery photos are big. Shrink them before upload (faster on mobile data).
 *  If the browser can't decode the file (e.g. HEIC on Chrome), send the original as is. */
async function prepareImage(file) {
  try {
    if (file.type === 'image/jpeg' && file.size < 1.5 * 1024 * 1024) return file
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
    if (bitmap.close) bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob || (file.type === 'image/jpeg' && blob.size >= file.size)) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

// ── component ────────────────────────────────────────────────────────────

export default function ScanPage() {
  const navigate = useNavigate()
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)
  const urlsRef = useRef([]) // every object URL we create, so we can free them

  const [step, setStep] = useState('idle') // idle | uploading | processing | review | saving | done
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrls, setPreviewUrls] = useState([])
  const [uploadIds, setUploadIds] = useState([]) // in document order (from the server)
  const [error, setError] = useState(null)
  const [notices, setNotices] = useState([]) // [{ text, receiptId? }]
  const [rejected, setRejected] = useState(null) // { ids, urls, reason } when the server says "not a receipt"
  const [savedId, setSavedId] = useState(null)

  // OCR result (kept whole so nothing the server found is thrown away on save)
  const [ocr, setOcr] = useState(null)

  // Editable review fields
  const [vendorName, setVendorName] = useState('')
  const [receiptDate, setReceiptDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [gstin, setGstin] = useState('')

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    urlsRef.current = []
  }
  useEffect(() => revokeAll, []) // free the previews when leaving the page

  const reset = () => {
    revokeAll()
    setStep('idle')
    setPreviewUrls([])
    setUploadIds([])
    setError(null)
    setNotices([])
    setRejected(null)
    setSavedId(null)
    setOcr(null)
    setVendorName('')
    setReceiptDate('')
    setTotalAmount('')
    setCategory('Other')
    setInvoiceNo('')
    setGstin('')
  }

  // ── pick → upload → OCR ───────────────────────────────────────────────

  const handlePicked = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // lets the user pick the same photo again later
    if (!picked.length) return

    const images = picked.filter(isImage)
    if (!images.length) {
      setError('Please choose photos of your receipt. Videos and other files can’t be scanned.')
      return
    }
    if (images.length > MAX_FILES) {
      setError(`You can scan at most ${MAX_FILES} pages at once.`)
      return
    }
    startUploadAndOcr(images)
  }

  const startUploadAndOcr = async (files) => {
    setError(null)
    setNotices([])
    setRejected(null)
    setStep('uploading')
    setUploadProgress(0)

    try {
      const prepared = await Promise.all(files.map(prepareImage))
      const tooBig = prepared.find((f) => f.size > MAX_BYTES)
      if (tooBig) {
        setError(`${tooBig.name} is larger than 10 MB. Please choose a smaller photo.`)
        setStep('idle')
        return
      }

      revokeAll()
      const urls = prepared.map((f) => URL.createObjectURL(f))
      urlsRef.current = urls
      setPreviewUrls(urls)

      const res = await uploadManyReceipts(prepared, (pct) => setUploadProgress(pct))
      const ids = res.uploads.map((u) => u.upload_id)
      const dupNames = res.uploads.filter((u) => u.already_saved_receipt_id)
      const early = dupNames.length
        ? [{ text: `${dupNames.map((u) => u.filename).join(', ')} looks identical to a receipt you already saved.`, receiptId: dupNames[0].already_saved_receipt_id }]
        : []

      await runOcr(ids, urls, early, false)
    } catch (err) {
      console.error(err)
      setError(errorMessage(err, 'Could not upload the photo. Please try again.'))
      setStep('idle')
    }
  }

  const runOcr = async (ids, urls, earlyNotices, force) => {
    setStep('processing')
    try {
      const res = await processPages(ids, { force })

      if (res.is_receipt === false) {
        setRejected({ ids, urls, early: earlyNotices, reason: res.rejection_reason })
        setStep('idle')
        return
      }

      // Save pages in the order the server found in the document, and show them that way.
      const ordered = res.upload_ids?.length ? res.upload_ids : ids
      const urlById = Object.fromEntries(ids.map((id, i) => [id, urls[i]]))
      setUploadIds(ordered)
      setPreviewUrls(ordered.map((id) => urlById[id]).filter(Boolean))

      setOcr(res)
      setVendorName(res.vendor_name || '')
      setReceiptDate(res.receipt_date || '') // ISO date, or empty: the server then uses today's date
      setTotalAmount(res.total != null ? String(res.total) : '')
      setCategory(normalizeCategory(res.category))
      setInvoiceNo(res.invoice_number || '')
      setGstin(res.vendor_gstin || '')

      const list = [...earlyNotices]
      if (res.review_reason) list.push({ text: res.review_reason })
      if (res.duplicate_warning) list.push({ text: res.duplicate_warning, receiptId: res.possible_duplicate_of })
      setNotices(list)
      setStep('review')
    } catch (err) {
      console.error(err)
      setError(errorMessage(err, 'Could not read this receipt. Please try another photo.'))
      setStep('idle')
    }
  }

  // ── save ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setStep('saving')
    setError(null)
    try {
      const saved = await saveReceipt({
        upload_ids: uploadIds,
        vendor_name: vendorName.trim() || 'Unknown Vendor',
        vendor_gstin: gstin.trim() || null,
        invoice_number: invoiceNo.trim() || null,
        document_type: ocr?.document_type || 'printed_receipt',
        date: ocr?.date || null, // as printed
        receipt_date: receiptDate || null, // what the user confirmed
        total: num(totalAmount),
        tax_total: ocr?.tax_total || 0,
        discount_total: ocr?.discount_total || 0,
        currency: ocr?.currency || 'INR',
        category,
        confidence: ocr?.confidence || 'medium',
        needs_review: !!ocr?.needs_review,
        review_reason: ocr?.review_reason || null,
        total_auto_corrected: !!ocr?.total_auto_corrected,
        items: (ocr?.items || []).map((it) => ({
          name: it.name || 'Item',
          quantity: num(it.quantity) > 0 ? num(it.quantity) : 1,
          unit: it.unit || null,
          hsn_code: it.hsn_code || null,
          unit_price: num(it.unit_price),
          discount: num(it.discount),
          taxable_value: num(it.taxable_value),
          tax_rate: num(it.tax_rate),
          tax_amount: num(it.tax_amount),
          total_price: num(it.total_price),
        })),
        raw_ocr_text: ocr?.raw_ocr_text || '',
      })
      setSavedId(saved.id)
      setStep('done')
    } catch (err) {
      console.error(err)
      setError(errorMessage(err, 'Could not save the receipt. Please try again.'))
      setStep('review')
    }
  }

  // ── screens ───────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="page-inner" style={{ ...styles.container, textAlign: 'center', paddingTop: '40px' }}>
        <div style={styles.successIconCircle}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={styles.doneTitle}>Receipt Saved</h2>
        <p style={styles.doneText}>Your receipt and its photo are saved. You can open it any time from Receipts.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '280px', margin: '0 auto' }}>
          {savedId && (
            <button className="btn btn-primary" onClick={() => navigate(`/receipts/${savedId}`)}>
              View receipt
            </button>
          )}
          <button className="btn btn-secondary" onClick={reset}>Scan another receipt</button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to dashboard</button>
        </div>
      </div>
    )
  }

  const busy = step === 'uploading' || step === 'processing'

  return (
    <div className="page-inner" style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-cream)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={styles.backText}>Back</span>
        </button>
        <h2 style={styles.headerTitle}>Scan Receipt</h2>
        <div style={{ width: '48px' }} />
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Hidden pickers: one opens the phone's photo gallery, one opens the camera */}
      <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePicked} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePicked} />

      {/* Step 1: choose the photo */}
      {step === 'idle' && (
        <div style={styles.pickCard}>
          <div style={styles.uploadIconCircle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <h3 style={styles.dropTitle}>Add your receipt</h3>
          <p style={styles.dropSub}>Pick photos from your phone’s gallery, or take a new one. For a long bill, select all its pages (up to {MAX_FILES}).</p>

          {rejected && (
            <div style={styles.noticeBox}>
              <div style={{ marginBottom: '8px' }}>{rejected.reason || 'This doesn’t look like a receipt.'}</div>
              <button className="btn btn-secondary" style={{ padding: '7px 14px' }} onClick={() => runOcr(rejected.ids, rejected.urls, rejected.early || [], true)}>
                It is a receipt, use it anyway
              </button>
            </div>
          )}

          <button className="btn btn-primary" style={styles.bigBtn} onClick={() => galleryRef.current?.click()}>
            Choose from gallery
          </button>
          <button className="btn btn-secondary" style={styles.bigBtn} onClick={() => cameraRef.current?.click()}>
            Take a photo
          </button>
          <div style={styles.formatBadge}>Photos only · up to 10 MB each</div>
        </div>
      )}

      {/* Step 2: uploading / reading */}
      {busy && (
        <div style={styles.loadingCard}>
          {previewUrls.length > 0 && (
            <div style={styles.previewStrip}>
              {previewUrls.map((url, i) => (
                <img key={i} src={url} alt={`Page ${i + 1}`} style={styles.previewImage} />
              ))}
            </div>
          )}
          {step === 'uploading' ? (
            <>
              <h3 style={styles.loadingTitle}>Uploading {previewUrls.length > 1 ? `${previewUrls.length} pages` : 'photo'}</h3>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
              </div>
              <span style={styles.progressPct} className="tabular-nums">{uploadProgress}%</span>
            </>
          ) : (
            <>
              <div className="spinner" style={{ margin: '14px 0 10px' }} />
              <h3 style={styles.loadingTitle}>Reading your receipt</h3>
              <p style={styles.loadingSub}>Finding the shop, date, items and total. This can take a few seconds.</p>
            </>
          )}
        </div>
      )}

      {/* Step 3: review and save */}
      {(step === 'review' || step === 'saving') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {notices.length > 0 && (
            <div style={styles.noticeBox}>
              {notices.map((n, i) => (
                <div key={i} style={{ marginBottom: i < notices.length - 1 ? '8px' : 0 }}>
                  {n.text}
                  {n.receiptId && (
                    <button style={styles.linkBtn} onClick={() => window.open(`/receipts/${n.receiptId}`, '_blank')}>
                      View it
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {previewUrls.length > 0 && (
            <div style={styles.previewCard}>
              <div style={styles.previewStrip}>
                {previewUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative', flex: previewUrls.length === 1 ? '1 1 100%' : '0 0 70%' }}>
                    <img src={url} alt={`Page ${i + 1}`} style={styles.reviewImage} />
                    {previewUrls.length > 1 && <span style={styles.pageBadge}>p{i + 1}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.formCard}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={styles.formTitle}>Check the details</h3>
              <p style={styles.formSubtitle}>Fix anything that looks wrong, then save</p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Shop / merchant</label>
              <input type="text" className="form-input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Super Mart" />
            </div>

            <div style={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Date</label>
                <input type="date" className="form-input" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Total ({ocr?.currency || 'INR'})</label>
                <input type="number" step="0.01" className="form-input tabular-nums" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            {!receiptDate && <p style={styles.hint}>No date found. If you leave it empty, today’s date is used.</p>}

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Category</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Invoice no.</label>
                <input type="text" className="form-input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="optional" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Seller GSTIN</label>
                <input type="text" className="form-input" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="optional" />
              </div>
            </div>

            {(ocr?.items || []).length > 0 && (
              <div style={{ marginTop: '14px', marginBottom: '8px' }}>
                <label style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Items found ({ocr.items.length})</label>
                <div style={styles.itemsList}>
                  {ocr.items.map((it, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <span style={styles.itemTitle}>{it.name}</span>
                      <span style={styles.itemPrice} className="tabular-nums">{formatINR(it.total_price || it.unit_price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px' }} onClick={handleSave} disabled={step === 'saving'}>
              {step === 'saving' ? 'Saving…' : 'Save receipt'}
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px', padding: '10px' }} onClick={reset} disabled={step === 'saving'}>
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-cream)', color: 'var(--text-on-cream)', minHeight: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingTop: '4px' },
  backButton: { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' },
  backText: { fontSize: '13.5px', fontWeight: '600', color: 'var(--text-on-cream)' },
  headerTitle: { fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-serif)', color: 'var(--text-on-cream)' },
  errorBox: { backgroundColor: 'rgba(229,115,106,0.14)', border: '1px solid rgba(229,115,106,0.4)', borderRadius: '14px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#9C2F26', fontWeight: '500' },
  noticeBox: { backgroundColor: 'rgba(242,178,27,0.16)', border: '1px solid rgba(242,178,27,0.5)', borderRadius: '14px', padding: '10px 14px', fontSize: '12.5px', lineHeight: 1.4, color: 'var(--text-on-cream)', marginBottom: '14px', width: '100%', boxSizing: 'border-box' },
  linkBtn: { background: 'none', border: 'none', color: 'var(--accent-dark)', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', marginLeft: '6px', padding: 0 },
  pickCard: { backgroundColor: 'var(--surface-cream)', border: '1px solid var(--border-cream)', borderRadius: '24px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  uploadIconCircle: { width: '56px', height: '56px', borderRadius: '18px', backgroundColor: 'rgba(0,191,165,0.15)', border: '1px solid var(--border-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' },
  dropTitle: { fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-serif)', marginBottom: '6px' },
  dropSub: { fontSize: '13px', color: 'var(--text-muted-cream)', marginBottom: '18px', maxWidth: '280px', lineHeight: 1.45 },
  bigBtn: { width: '100%', maxWidth: '300px', padding: '13px', marginBottom: '10px', fontSize: '14.5px' },
  formatBadge: { fontSize: '11px', fontWeight: '600', color: 'var(--accent-dark)', backgroundColor: 'rgba(11,107,90,0.12)', padding: '4px 12px', borderRadius: '9999px', marginTop: '6px' },
  loadingCard: { backgroundColor: 'var(--surface-cream)', borderRadius: '24px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid var(--border-cream)' },
  previewStrip: { display: 'flex', gap: '8px', overflowX: 'auto', width: '100%', marginBottom: '8px' },
  previewImage: { height: '160px', maxWidth: '70%', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'var(--bg-cream)', border: '1px solid var(--border-cream)', flex: '0 0 auto' },
  loadingTitle: { fontSize: '15px', fontWeight: '600', fontFamily: 'var(--font-serif)', marginBottom: '4px' },
  loadingSub: { fontSize: '12.5px', color: 'var(--text-muted-cream)', maxWidth: '260px', lineHeight: 1.4 },
  progressBar: { width: '100%', maxWidth: '280px', height: '6px', backgroundColor: 'var(--olive-track)', borderRadius: '9999px', overflow: 'hidden', marginTop: '14px' },
  progressFill: { height: '100%', backgroundColor: 'var(--accent)', borderRadius: '9999px', transition: 'width 0.2s ease' },
  progressPct: { fontSize: '12px', color: 'var(--text-muted-cream)', marginTop: '6px', fontWeight: '600' },
  previewCard: { backgroundColor: 'var(--surface-cream)', borderRadius: '24px', padding: '12px', border: '1px solid var(--border-cream)' },
  reviewImage: { width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '12px', display: 'block' },
  pageBadge: { position: 'absolute', top: '6px', left: '6px', backgroundColor: 'var(--accent-dark)', color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '9999px', padding: '1px 7px' },
  formCard: { backgroundColor: 'var(--surface-cream)', borderRadius: '24px', padding: '22px 20px', border: '1px solid var(--border-cream)' },
  formTitle: { fontSize: '16px', fontWeight: '600', fontFamily: 'var(--font-serif)' },
  formSubtitle: { fontSize: '12px', color: 'var(--text-muted-cream)', marginTop: '2px' },
  fieldGroup: { marginBottom: '12px' },
  fieldRow: { display: 'flex', gap: '12px', marginBottom: '12px' },
  fieldLabel: { display: 'block', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted-cream)', marginBottom: '5px' },
  hint: { fontSize: '11.5px', color: 'var(--text-muted-cream)', margin: '-6px 0 12px 4px' },
  itemsList: { backgroundColor: 'var(--bg-cream)', borderRadius: '16px', padding: '6px 14px', border: '1px solid var(--border-cream)' },
  itemRow: { display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--border-cream)', fontSize: '12.5px' },
  itemTitle: { fontWeight: '500', minWidth: 0 },
  itemPrice: { fontWeight: '600', fontFamily: 'var(--font-serif)', flexShrink: 0 },
  successIconCircle: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0,191,165,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
  doneTitle: { fontSize: '22px', fontWeight: '600', fontFamily: 'var(--font-serif)', marginBottom: '8px' },
  doneText: { color: 'var(--text-muted-cream)', fontSize: '13.5px', maxWidth: '280px', margin: '0 auto 28px', lineHeight: 1.45 },
}
