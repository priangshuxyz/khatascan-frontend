import client from './client.js'

/**
 * List receipts with pagination, filtering, and sorting.
 * @param {object} params
 * @param {number} params.page - 1-based page number
 * @param {number} params.per_page - Number of items per page (default: 10)
 * @param {string} [params.category] - Optional category filter
 * @param {string} [params.document_type] - Optional document type filter
 * @param {boolean} [params.needs_review] - Optional filter for flagged receipts
 * @param {string} [params.q] - Search query for vendor name or invoice number
 * @param {string} [params.sort] - Direct sort parameter (e.g. '-created_at', 'total')
 * @param {string} [params.sort_by] - Field to sort by if sort is not provided
 * @param {string} [params.order] - 'desc' or 'asc' (default: 'desc')
 */
export async function listReceipts({
  page = 1,
  per_page = 10,
  category,
  document_type,
  needs_review,
  q,
  sort,
  sort_by = 'created_at',
  order = 'desc',
} = {}) {
  let sortParam = sort
  if (!sortParam && sort_by) {
    sortParam = order === 'desc' ? `-${sort_by}` : sort_by
  }

  const params = { page, per_page }
  if (sortParam) params.sort = sortParam
  if (category) params.category = category
  if (document_type) params.document_type = document_type
  if (needs_review !== undefined && needs_review !== null) params.needs_review = needs_review
  if (q) params.q = q

  const { data } = await client.get('/receipts', { params })
  return data
}

/**
 * Get a single receipt by id.
 * @param {string|number} id
 */
export async function getReceipt(id) {
  const { data } = await client.get(`/receipts/${id}`)
  return data
}

/**
 * Upload a single receipt image (Step 1).
 * @param {File} file
 * @param {function} [onProgress]
 */
export async function uploadReceipt(file, onProgress) {
  const form = new FormData()
  form.append('files', file)

  const { data } = await client.post('/receipts/upload-many', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })

  if (!data.uploads?.length) {
    throw new Error('Receipt upload failed.')
  }

  return data.uploads[0]
}

/**
 * Upload multiple receipt images at once (Step 1, multi-page variant).
 * Uses POST /receipts/upload-many; returns { uploads: UploadResponse[] }.
 * @param {File[]} files
 * @param {function} [onProgress]  receives 0–100
 */
export async function uploadManyReceipts(files, onProgress) {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const { data } = await client.post('/receipts/upload-many', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  return data // { uploads: [{ upload_id, filename, size_kb, already_saved_receipt_id }] }
}

/**
 * Process (OCR) multiple uploaded pages as one invoice (Step 2, multi-page variant).
 * Uses POST /receipts/process-pages; returns a single merged ProcessResponse.
 * @param {string[]} uploadIds  - ordered list of upload_ids from uploadManyReceipts
 * @param {object} [options]
 * @param {boolean} [options.force=false]
 */
export async function processPages(uploadIds, { force = false } = {}) {
  const params = {}
  if (force) params.force = true
  // Gemini can take a while on multi-page invoices, so allow up to 2 minutes.
  const { data } = await client.post('/receipts/process-pages', { upload_ids: uploadIds }, { params, timeout: 120000 })
  return data
}

/**
 * Process (OCR) an uploaded receipt (Step 2).
 * @param {string} uploadId
 * @param {object} [options]
 * @param {boolean} [options.force=false]
 */
export async function processReceipt(uploadId, { force = false } = {}) {
  const params = {}
  if (force) params.force = true

  const { data } = await client.post(`/receipts/${uploadId}/process`, null, { params, timeout: 120000 })
  return data
}

/**
 * Save a confirmed receipt to the database (Step 3).
 * Supports both single upload_id and multi-page upload_ids.
 * @param {object} payload - ReceiptCreate body
 */
export async function saveReceipt(payload) {
  const upload_ids = payload.upload_ids || (payload.upload_id ? [payload.upload_id] : [])
  const body = {
    ...payload,
    upload_ids,
  }
  const { data } = await client.post('/receipts', body)
  return data
}

/**
 * Partially update a receipt.
 * @param {string} id
 * @param {object} payload - ReceiptUpdate body
 */
export async function updateReceipt(id, payload) {
  const { data } = await client.patch(`/receipts/${id}`, payload)
  return data
}

/**
 * Delete a receipt and its associated files.
 * @param {string} id
 */
export async function deleteReceipt(id) {
  const { data } = await client.delete(`/receipts/${id}`)
  return data
}
