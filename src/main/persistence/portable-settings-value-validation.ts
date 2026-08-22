export type PortableValueMap = Record<string, unknown>

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isSafeObjectKey(key: string): boolean {
  return (
    key.length > 0 && key.length <= 256 && !['__proto__', 'constructor', 'prototype'].includes(key)
  )
}

export function cloneBoundedJson(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return undefined
  }
  if (value === null || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.length <= 8192 ? value : undefined
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (Array.isArray(value)) {
    if (value.length > 1000) {
      return undefined
    }
    const result: unknown[] = []
    for (const entry of value) {
      const cloned = cloneBoundedJson(entry, depth + 1)
      if (cloned === undefined) {
        return undefined
      }
      result.push(cloned)
    }
    return result
  }
  if (!isRecord(value) || Object.keys(value).length > 200) {
    return undefined
  }
  const result: PortableValueMap = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!isSafeObjectKey(key)) {
      return undefined
    }
    const cloned = cloneBoundedJson(entry, depth + 1)
    if (cloned === undefined) {
      return undefined
    }
    result[key] = cloned
  }
  return result
}

export function copySafeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 8192 ? value : undefined
}

export function copySafeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function copySafeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > 200) {
    return undefined
  }
  const result: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.length > 512) {
      return undefined
    }
    result.push(entry)
  }
  return result
}

export function copySafeStringRecord(
  value: unknown,
  maxValueLength = 4096
): Record<string, string> | undefined {
  if (!isRecord(value) || Object.keys(value).length > 100) {
    return undefined
  }
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!isSafeObjectKey(key) || typeof entry !== 'string' || entry.length > maxValueLength) {
      return undefined
    }
    result[key] = entry
  }
  return result
}
