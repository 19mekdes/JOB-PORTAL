export const safeJsonParse = (value: any, fallback: any = []) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value ?? fallback
}
