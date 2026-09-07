import * as React from 'react'
import { Calendar, Ellipsis, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { createTodoItem, updateTodoItem, deleteTodoItem } from '@/api/services/dashboard-service'
import type { TodoItem } from '../types'

function formatTodoDate(isoDate: string): string {
  if (!isoDate) {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function parseDisplayDate(display: string): string {
  const d = new Date(display)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

interface DashboardTodoListProps {
  items: TodoItem[]
  isLoading?: boolean
}

export function DashboardTodoList({ items, isLoading = false }: DashboardTodoListProps) {
  const [todos, setTodos] = React.useState<TodoItem[]>(items)

  // Add state
  const [isAdding, setIsAdding] = React.useState(false)
  const [addText, setAddText] = React.useState('')
  const [addDate, setAddDate] = React.useState('')

  // Edit state
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editText, setEditText] = React.useState('')
  const [editDate, setEditDate] = React.useState('')

  // Delete state
  const [deleteTarget, setDeleteTarget] = React.useState<TodoItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const addInputRef = React.useRef<HTMLInputElement>(null)
  const editInputRef = React.useRef<HTMLInputElement>(null)
  const addRowRef = React.useRef<HTMLDivElement>(null)
  const editDateRef = React.useRef<HTMLInputElement>(null)
  const addDateRef = React.useRef<HTMLInputElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [lockedHeight, setLockedHeight] = React.useState<number | null>(null)

  React.useEffect(() => {
    setTodos(items)
  }, [items])

  // Lock height to initial render size so adding items doesn't grow the widget
  React.useEffect(() => {
    if (items.length > 0 && lockedHeight === null && cardRef.current) {
      // Wait for the DOM to paint with the actual items before measuring
      requestAnimationFrame(() => {
        if (cardRef.current) {
          setLockedHeight(cardRef.current.getBoundingClientRect().height)
        }
      })
    }
  }, [items, lockedHeight])

  React.useEffect(() => {
    if (isAdding) {
      addInputRef.current?.focus()
      addRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isAdding])

  React.useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  // ── Toggle ──
  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
    const todo = todos.find(t => t.id === id)
    if (todo) {
      updateTodoItem(id, { completed: !todo.completed }).catch(() => {
        setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
      })
    }
  }

  // ── Add ──
  const handleAdd = () => {
    const text = addText.trim()
    if (!text) return

    const date = addDate ? formatTodoDate(addDate) : formatTodoDate('')
    const tempId = `todo-temp-${Date.now()}`
    const newItem: TodoItem = { id: tempId, text, date, completed: false }

    setTodos(prev => [...prev, newItem])
    setIsAdding(false)
    setAddText('')
    setAddDate('')

    createTodoItem({ text, date }).then(created => {
      setTodos(prev => prev.map(t => (t.id === tempId ? created : t)))
    }).catch(() => {
      setTodos(prev => prev.filter(t => t.id !== tempId))
    })
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setAddText('')
    setAddDate('')
  }

  // ── Edit ──
  const handleStartEdit = (todo: TodoItem) => {
    setEditingId(todo.id)
    setEditText(todo.text)
    setEditDate(parseDisplayDate(todo.date))
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const text = editText.trim()
    if (!text) return

    const date = editDate ? formatTodoDate(editDate) : formatTodoDate('')
    const prevTodos = [...todos]

    setTodos(prev => prev.map(t => (t.id === editingId ? { ...t, text, date } : t)))
    const id = editingId
    setEditingId(null)
    setEditText('')
    setEditDate('')

    updateTodoItem(id, { text, date }).catch(() => {
      setTodos(prevTodos)
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
    setEditDate('')
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const prevTodos = [...todos]

    setTodos(prev => prev.filter(t => t.id !== deleteTarget.id))

    try {
      await deleteTodoItem(deleteTarget.id)
    } catch {
      setTodos(prevTodos)
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <Tile id="todo-list-tile" layoutMode="block" background="transparent" padding={0} shadowed={false} className="h-full">
        <Card className="pt-4 pb-4 flex flex-col gap-0 h-full">
          <CardHeader className="flex-shrink-0 pb-2">
            <h3 className="text-section-title">To Do List</h3>
            <CardAction><Skeleton className="h-6 w-6" /></CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="todo-list-tile" layoutMode="block" background="transparent" padding={0} shadowed={false} className="h-full">
      <div ref={cardRef} className="h-full" style={lockedHeight ? { maxHeight: lockedHeight } : undefined}>
      <Card className="pt-4 pb-4 flex flex-col gap-0 h-full">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">To Do List</h3>
          <CardAction>
            <button
              className="tap-area p-1 rounded-md hover:bg-accent transition-colors"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0 flex-1 min-h-0 overflow-y-auto">
          <div className="divide-y divide-border">
            {todos.map(todo =>
              editingId === todo.id ? (
                /* ── Edit Mode Row ── */
                <div key={todo.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="w-4 shrink-0" />
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <Input
                      ref={editInputRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="h-8 text-sm flex-1"
                    />
                    <input
                      ref={editDateRef}
                      type="date"
                      value={editDate}
                      onChange={e => {
                        setEditDate(e.target.value)
                        editInputRef.current?.focus()
                      }}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => editDateRef.current?.showPicker()}
                      className={cn(
                        'p-1.5 rounded-md hover:bg-accent transition-colors shrink-0',
                        editDate ? 'text-foreground' : 'text-muted-foreground',
                      )}
                      title={editDate ? formatTodoDate(editDate) : 'Pick a date'}
                    >
                      <Calendar className="w-4 h-4" style={{ color: 'var(--heading)' }} />
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal Mode Row ── */
                <div
                  key={todo.id}
                  className="flex items-start gap-3 group py-3 first:pt-0"
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-body font-medium leading-tight',
                        todo.completed && 'line-through text-muted-foreground',
                      )}
                      style={!todo.completed ? { color: 'var(--heading)' } : undefined}
                    >
                      {todo.text}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--heading)' }} />
                      <span className="text-caption" style={{ color: 'var(--heading)' }}>{todo.date}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded-md opacity-0 touch:opacity-100 group-hover:opacity-100 focus:opacity-100 hover:bg-accent transition-all shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <Ellipsis className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStartEdit(todo)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(todo)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            )}

            {/* ── Add Row ── */}
            {isAdding && (
              <div ref={addRowRef} className="flex items-center gap-3 py-3">
                <div className="w-4 shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <Input
                    ref={addInputRef}
                    placeholder="What needs to be done?"
                    value={addText}
                    onChange={e => setAddText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') handleCancelAdd()
                    }}
                    className="h-8 text-sm flex-1"
                  />
                  <input
                    ref={addDateRef}
                    type="date"
                    value={addDate}
                    onChange={e => {
                      setAddDate(e.target.value)
                      addInputRef.current?.focus()
                    }}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => addDateRef.current?.showPicker()}
                    className={cn(
                      'p-1.5 rounded-md hover:bg-accent transition-colors shrink-0',
                      addDate ? 'text-foreground' : 'text-muted-foreground',
                    )}
                    title={addDate ? formatTodoDate(addDate) : 'Pick a date'}
                  >
                    <Calendar className="w-4 h-4" style={{ color: 'var(--heading)' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.text}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault()
                await handleDelete()
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tile>
  )
}
