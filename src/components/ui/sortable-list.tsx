/**
 * SortableList — Reusable drag-and-drop sortable list component.
 *
 * Built on @dnd-kit/sortable. Provides:
 * - `SortableList` wrapper (DndContext + SortableContext)
 * - `SortableItem` wrapper for each draggable row
 * - `SortableDragHandle` for the grip icon
 *
 * Usage:
 * ```tsx
 * <SortableList items={items} onReorder={setItems} keyExtractor={item => item.id}>
 *   {(item, index) => (
 *     <SortableItem id={item.id}>
 *       <SortableDragHandle />
 *       <span>{item.label}</span>
 *     </SortableItem>
 *   )}
 * </SortableList>
 * ```
 *
 * The component is fully generic — works with any data type.
 * Styling is left to the consumer via className/style on SortableItem.
 */

import * as React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { text } from '@/theme/colors'

// ============================================================================
// SortableList — container
// ============================================================================

interface SortableListProps<T> {
  /** Array of items to render */
  items: T[]
  /** Called with the reordered array after a drag */
  onReorder: (items: T[]) => void
  /** Extract a unique string ID from each item */
  keyExtractor: (item: T) => string
  /** Render function for each item */
  children: (item: T, index: number) => React.ReactNode
  /** Optional className for the list container */
  className?: string
  /** Optional style for the list container */
  style?: React.CSSProperties
}

export function SortableList<T>({
  items,
  onReorder,
  keyExtractor,
  children,
  className,
  style,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const ids = React.useMemo(() => items.map(keyExtractor), [items, keyExtractor])

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = ids.indexOf(String(active.id))
      const newIndex = ids.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return

      onReorder(arrayMove(items, oldIndex, newIndex))
    },
    [items, ids, onReorder],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className} style={style}>
          {items.map((item, index) => children(item, index))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

// ============================================================================
// SortableItem — individual draggable row
// ============================================================================

interface SortableItemProps {
  /** Unique ID matching the keyExtractor output */
  id: string
  /** Content to render */
  children: React.ReactNode
  /** Optional className */
  className?: string
  /** Optional inline style */
  style?: React.CSSProperties
}

export function SortableItem({ id, children, className, style }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const combinedStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  }

  return (
    <SortableItemContext.Provider value={{ attributes, listeners }}>
      <div ref={setNodeRef} className={className} style={combinedStyle}>
        {children}
      </div>
    </SortableItemContext.Provider>
  )
}

// ============================================================================
// SortableDragHandle — grip icon that triggers drag
// ============================================================================

/** Context to pass dnd listeners from SortableItem to DragHandle */
const SortableItemContext = React.createContext<{
  attributes: Record<string, any>
  listeners: Record<string, any> | undefined
}>({
  attributes: {},
  listeners: undefined,
})

interface SortableDragHandleProps {
  /** Optional className */
  className?: string
}

export function SortableDragHandle({ className }: SortableDragHandleProps) {
  const { attributes, listeners } = React.useContext(SortableItemContext)

  return (
    <button
      type="button"
      className={`touch-none cursor-grab active:cursor-grabbing flex-shrink-0 ${className ?? ''}`}
      style={{ color: text.muted }}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  )
}
