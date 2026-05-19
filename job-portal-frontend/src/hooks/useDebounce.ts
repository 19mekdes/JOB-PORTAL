/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Debounce a value change
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounce a function call
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Throttle a function call (limit execution rate)
 * @param callback - The function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 500
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastRunRef.current >= limit) {
        callback(...args)
        lastRunRef.current = now
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          callback(...args)
          lastRunRef.current = Date.now()
          timeoutRef.current = null
        }, limit - (now - lastRunRef.current))
      }
    },
    [callback, limit]
  )
}

/**
 * Debounce a promise-returning function (prevents rapid successive calls)
 * @param callback - The async function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced async function
 */
export function useDebouncedAsync<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  const timeoutRef = useRef<number | null>(null)
  const pendingPromiseRef = useRef<{
    resolve: (value: ReturnType<T> | null) => void
    reject: (reason?: any) => void
  } | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (pendingPromiseRef.current) {
        pendingPromiseRef.current.resolve(null)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      return new Promise((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        pendingPromiseRef.current = { resolve, reject }
        
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await callback(...args)
            if (pendingPromiseRef.current) {
              pendingPromiseRef.current.resolve(result)
              pendingPromiseRef.current = null
            }
          } catch (error) {
            if (pendingPromiseRef.current) {
              pendingPromiseRef.current.reject(error)
              pendingPromiseRef.current = null
            }
          }
          timeoutRef.current = null
        }, delay)
      })
    },
    [callback, delay]
  )
}

/**
 * Debounce with leading and trailing options
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @param options - Debounce options
 * @returns Debounced function
 */
interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
}

export function useDebounceWithOptions<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: DebounceOptions = { leading: false, trailing: true }
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<number | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)
  const leadingCalledRef = useRef<boolean>(false)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (options.leading && !leadingCalledRef.current) {
        callback(...args)
        leadingCalledRef.current = true
      } else {
        lastArgsRef.current = args
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (options.trailing && lastArgsRef.current) {
          callback(...lastArgsRef.current)
        }
        leadingCalledRef.current = false
        lastArgsRef.current = null
        timeoutRef.current = null
      }, delay)
    },
    [callback, delay, options.leading, options.trailing]
  )
}

// Example usage with search input
export const useSearchDebounce = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm
  }
}

// Example usage with form input
export const useFormDebounce = <T>(initialValue: T, delay: number = 300) => {
  const [value, setValue] = useState<T>(initialValue)
  const debouncedValue = useDebounce(value, delay)

  return {
    value,
    setValue,
    debouncedValue
  }
}

// Example usage with API calls
export const useApiDebounce = <T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  delay: number = 500
) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null)
  
  const debouncedApiCall = useDebouncedAsync(apiCall, delay)

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await debouncedApiCall(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [debouncedApiCall]
  )

  return {
    execute,
    isLoading,
    error,
    data,
    reset: () => {
      setData(null)
      setError(null)
      setIsLoading(false)
    }
  }
}

export default useDebounce