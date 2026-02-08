'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CountUpProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
}

export function CountUp({
  value,
  className,
  prefix = '',
  suffix = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: '-10px' })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [motionValue, isInView, value])

  useEffect(() => {
    const update = (latest: number) => {
      if (ref.current) {
        ref.current.textContent = prefix + Intl.NumberFormat('en-US').format(Math.round(latest)) + suffix
      }
    }

    // Initialize with current value
    update(springValue.get())

    return springValue.on('change', update)
  }, [springValue, prefix, suffix])

  return <span ref={ref} className={cn("tabular-nums", className)} />
}
