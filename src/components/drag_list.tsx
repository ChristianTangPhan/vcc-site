import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

// List whose items can be reordered by dragging a ☰ handle.
// Uses pointer events (not HTML drag-and-drop) so it works with touch on iPhone.
export function DragList<T>({
  items,
  getKey,
  enabled,
  onReorder,
  renderItem,
}: {
  items: T[]
  getKey: (item: T) => string
  enabled: boolean
  onReorder: (newItems: T[]) => void
  renderItem: (item: T, handle: ReactNode) => ReactNode
}) {
  // While dragging, show this local order instead of `items`
  const [dragging, setDragging] = useState<{ key: string; list: T[] } | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

  const list = dragging?.list ?? items

  function start(e: PointerEvent<HTMLButtonElement>, key: string) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId) // keep getting moves even off the handle
    setDragging({ key, list: items })
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return
    const y = e.clientY
    const others = dragging.list.filter((it) => getKey(it) !== dragging.key)
    const dragged = dragging.list.find((it) => getKey(it) === dragging.key)
    if (!dragged) return

    // New spot = how many other rows have their middle above the finger
    let index = 0
    for (const it of others) {
      const rect = rowRefs.current.get(getKey(it))?.getBoundingClientRect()
      if (rect && rect.top + rect.height / 2 < y) index++
    }

    const next = [...others.slice(0, index), dragged, ...others.slice(index)]
    const changed = next.some((it, i) => getKey(it) !== getKey(dragging.list[i]))
    if (changed) setDragging({ key: dragging.key, list: next })
  }

  function end() {
    if (!dragging) return
    const moved = dragging.list.some((it, i) => getKey(it) !== getKey(items[i]))
    if (moved) onReorder(dragging.list)
    setDragging(null)
  }

  return (
    <div className="drag-list">
      {list.map((item) => {
        const key = getKey(item)
        const handle = enabled ? (
          <button
            type="button"
            className="drag-handle"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            onPointerDown={(e) => start(e, key)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            ☰
          </button>
        ) : null

        return (
          <div
            key={key}
            ref={(el) => {
              if (el) rowRefs.current.set(key, el)
              else rowRefs.current.delete(key)
            }}
            className={`drag-row ${dragging?.key === key ? 'is-dragging' : ''}`}
          >
            {renderItem(item, handle)}
          </div>
        )
      })}
    </div>
  )
}
