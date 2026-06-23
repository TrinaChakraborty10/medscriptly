import DOMPurify from 'dompurify'

export function sanitizeText(value) {
  if (!value) return value
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

export function sanitizeForm(formObject) {
  const sanitized = {}
  for (const key in formObject) {
    const value = formObject[key]
    sanitized[key] = typeof value === 'string' ? sanitizeText(value) : value
  }
  return sanitized
}