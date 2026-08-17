import type { ReactNode } from 'react'

type Props = {
  size: number
  children: ReactNode
}

/**
 * The housing the record sits in: a rounded-square slab with a shallow round
 * recess milled into it. The stacked shadows and the inset top highlight are
 * what lift it off the page and make it read as an object rather than a card.
 */
export function TurntableBody({ size, children }: Props) {
  const recess = size * 0.84

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.0875,
        background: 'var(--housing)',
        border: '1px solid var(--panel-edge)',
        boxShadow: 'var(--housing-shadow)',
      }}
    >
      {/* the milled recess the platter drops into */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: recess,
          height: recess,
          marginLeft: -recess / 2,
          marginTop: -recess / 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 34%, #FBFBF9 0%, #F0F0EC 62%, #E2E2DD 100%)',
          boxShadow: `inset 0 ${size * 0.006}px ${size * 0.02}px rgba(0,0,0,0.09),
                      inset 0 -1px 0 rgba(255,255,255,0.9),
                      0 1px 0 rgba(255,255,255,0.8)`,
        }}
      />

      {children}
    </div>
  )
}
