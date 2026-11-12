export function formatINR(val) {
  if (val === undefined || val === null) return '₹ 0.00'
  return (
    '₹ ' +
    Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

/** "2026-04-03" -> 3 Apr 2026, without the time-zone shift that new Date('2026-04-03') causes. */
export function formatDay(value) {
  if (!value) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** The day a receipt counts for: the parsed printed date, else the day it was saved.
 *  (receipt.date is the raw printed text, e.g. "03/04/2026", and is ambiguous.) */
export function receiptDay(receipt) {
  return receipt.receipt_date || receipt.created_at
}
