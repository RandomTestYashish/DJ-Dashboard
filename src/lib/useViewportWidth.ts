import { useEffect, useState } from 'react'

/**
 * The viewport width, tracked so the player's proportions can be computed as
 * plain numbers. The records are positioned in stage coordinates, so their
 * sizes have to be real values rather than CSS the layout resolves later.
 */
export function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  )

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return width
}
