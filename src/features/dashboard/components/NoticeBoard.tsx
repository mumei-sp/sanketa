import * as React from 'react'
import { Ellipsis } from 'lucide-react'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { NoticeBoardEntry } from '@/features/notice-board/types'

interface NoticeBoardProps {
  items: NoticeBoardEntry[]
  isLoading?: boolean
}

export function NoticeBoard({ items, isLoading = false }: NoticeBoardProps) {
  const [sortBy, setSortBy] = React.useState('popular')

  const sorted = React.useMemo(() => {
    if (sortBy === 'recent') {
      return [...items].sort((a, b) => new Date(b.postDate).getTime() - new Date(a.postDate).getTime())
    }
    return [...items].sort((a, b) => b.views - a.views)
  }, [items, sortBy])

  if (isLoading) {
    return (
      <Tile id="notice-board-tile" layoutMode="block" background="transparent" padding={0} shadowed={false} className="h-full">
        <Card className="pt-4 pb-4 flex flex-col gap-0 h-full">
          <CardHeader className="flex-shrink-0 pb-2">
            <h3 className="text-section-title">Notice Board</h3>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="notice-board-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="pt-4 pb-4 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-2">
          <h3 className="text-section-title">Notice Board</h3>
          <CardAction>
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted-foreground">Sort by</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[100px] bg-accent h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-0">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-table-header text-muted-foreground pb-2 pr-3 font-medium" />
                <th className="text-left text-table-header text-muted-foreground pb-2 pr-3 font-medium whitespace-nowrap">Audience</th>
                <th className="text-left text-table-header text-muted-foreground pb-2 pr-3 font-medium whitespace-nowrap">Date</th>
                <th className="text-left text-table-header text-muted-foreground pb-2 pr-3 font-medium whitespace-nowrap">Created By</th>
                <th className="pb-2" />
              </tr>
            </thead>
          </table>
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full">
              <tbody>
                {sorted.map(item => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="size-[36px] min-w-[36px] rounded-md object-cover"
                        />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-body font-medium truncate" style={{ color: 'var(--heading)' }}>
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1">
                            {item.tags.map(tag => (
                              <span
                                key={tag.label}
                                className="text-badge px-2 py-0.5 rounded-full whitespace-nowrap"
                                style={{ backgroundColor: tag.color, color: 'var(--heading)' }}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-body-muted text-muted-foreground whitespace-nowrap align-middle">
                      {item.audience}
                    </td>
                    <td className="py-3 pr-3 text-body-muted text-muted-foreground whitespace-nowrap align-middle">
                      {item.postDate}
                    </td>
                    <td className="py-3 pr-3 text-body-muted text-muted-foreground whitespace-nowrap align-middle">
                      {item.createdBy}
                    </td>
                    <td className="py-3 align-middle">
                      <button className="tap-area p-1 rounded-md hover:bg-accent transition-colors">
                        <Ellipsis className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
