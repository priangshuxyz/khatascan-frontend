// One list of categories, matching the backend (app/normalize.py CATEGORIES).
export const CATEGORIES = [
  'Groceries',
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Health',
  'Entertainment',
  'Education',
  'Other',
]

const COLORS = {
  Groceries: '#00BFA5',
  'Food & Dining': '#0B6B5A',
  Transport: '#2E8B7A',
  Shopping: '#5FD3BC',
  'Bills & Utilities': '#C98B2B',
  Health: '#E5736A',
  Entertainment: '#7A6FB0',
  Education: '#4F8FBF',
  Other: '#9BB5A8',
}

// Names the old frontend used, in case old data or old tabs are still around.
const LEGACY = {
  Restaurant: 'Food & Dining',
  Utilities: 'Bills & Utilities',
  Others: 'Other',
}

export function normalizeCategory(name) {
  if (!name) return 'Other'
  if (COLORS[name]) return name
  return LEGACY[name] || 'Other'
}

/** { color, bg, text } for pills, dots and bars. */
export function categoryTheme(name) {
  const key = normalizeCategory(name)
  const color = COLORS[key]
  return { color, bg: `${color}2E`, text: '#0A1F18' }
}
