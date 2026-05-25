// components/loader.tsx
'use client'
import { useLoadingStore } from '@/lib/store/loading.store';
import { useEffect, useRef } from 'react'
import { create } from 'zustand'

const useVisibleStore = create<{ visible: boolean; setVisible: (v: boolean) => void }>((set) => ({
  visible: false,
  setVisible: (visible) => set({ visible }),
}))

export default function Loader() {
  const count = useLoadingStore((s) => s.count)
  const { visible, setVisible } = useVisibleStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (count > 0) {
      timerRef.current = setTimeout(() => setVisible(true), 1000)
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 0)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [count, setVisible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )
}