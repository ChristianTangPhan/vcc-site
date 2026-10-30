// List that editors can reorder by dragging a ☰ handle.
// Uses pointer events (not HTML drag-and-drop) so it works with touch on iPhone.
import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

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
    const dragged = dragging.list.find((it) => getKey(it) === dragging.key)
    if (!dragged) return
    const others = dragging.list.filter((it) => it !== dragged)

    // New spot = how many other rows have their middle above the finger
    const index = others.filter((it) => {
      const rect = rowRefs.current.get(getKey(it))?.getBoundingClientRect()
      return rect && rect.top + rect.height / 2 < e.clientY
    }).length

    const next = [...others.slice(0, index), dragged, ...others.slice(index)]
    if (next.some((it, i) => it !== dragging.list[i])) setDragging({ key: dragging.key, list: next })
  }

  function end() {
    if (!dragging) return
    if (dragging.list.some((it, i) => it !== items[i])) onReorder(dragging.list)
    setDragging(null)
  }

  return (
    <div className="drag-list">
      {list.map((item) => {
        const key = getKey(item)
        const handle = enabled && (
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
        )
        return (
          <div
            key={key}
            ref={(el) => { if (el) rowRefs.current.set(key, el); else rowRefs.current.delete(key) }}
            className={`drag-row ${dragging?.key === key ? 'is-dragging' : ''}`}
          >
            {renderItem(item, handle)}
          </div>
        )
      })}
    </div>
  )
}
