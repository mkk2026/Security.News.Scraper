export function validatePagination(limitParam: string | null, offsetParam: string | null) {
  let limit = parseInt(limitParam || '100')
  let offset = parseInt(offsetParam || '0')

  if (isNaN(limit) || limit < 1) limit = 100
  if (limit > 100) limit = 100
  if (isNaN(offset) || offset < 0) offset = 0

  return { limit, offset }
}
