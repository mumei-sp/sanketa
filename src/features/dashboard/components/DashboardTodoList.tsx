import * as React from 'react'
import { Calendar, Ellipsis } from 'lucide-react'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { baseColors } from '@/theme/colors'
import { cn } from '@/lib/utils'
import type { TodoItem } from '../types'

interface DashboardTodoListProps {
  items: TodoItem[]
  isLoading?: boolean
}

export function DashboardTodoList({ items, isLoading = false }: DashboardTodoListProps) {
  const [todos, setTodos] = React.useState<TodoItem[]>(items)

  React.useEffect(() => {
    setTodos(items)
  }, [items])

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
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
      <Card className="pt-4 pb-4 flex flex-col gap-0 h-full">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">To Do List</h3>
          <CardAction>
            <button className="p-1 rounded-md hover:bg-accent transition-colors">
              <Ellipsis className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0 flex-1 min-h-0 overflow-y-auto">
          <div className="divide-y divide-border">
            {todos.map(todo => (
              <label
                key={todo.id}
                className="flex items-start gap-3 cursor-pointer group py-3 first:pt-0"
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-body font-medium leading-tight',
                      todo.completed && 'line-through text-muted-foreground',
                    )}
                    style={!todo.completed ? { color: baseColors.heading } : undefined}
                  >
                    {todo.text}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" style={{ color: baseColors.heading }} />
                    <span className="text-caption" style={{ color: baseColors.heading }}>{todo.date}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
