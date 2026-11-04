import { useEffect, useState } from 'react'

const PREFIX = 'dsc-arcade:'

export function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(PREFIX + key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function useStored<T>(key: string, fallback: T) {
  const [v, setV] = useState<T>(() => load(key, fallback))
  useEffect(() => {
    save(key, v)
  }, [key, v])
  return [v, setV] as const
}
