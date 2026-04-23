import { useState, useEffect, useRef } from 'react'
import { validateJson } from '@/lib/jsonUtils'
import type { ValidationResult } from '@/types'

export function useJsonValidation(json: string, debounceMs = 150) {
  const [result, setResult] = useState<ValidationResult>({ valid: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setResult(validateJson(json))
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [json, debounceMs])

  return result
}
