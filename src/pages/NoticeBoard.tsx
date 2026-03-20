import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tile } from '@/components/tile'
import { baseColors, text } from '@/theme/colors'
import { useIsDesktop } from '@/hooks/use-mobile'
import { ClipboardList } from 'lucide-react'
import { fetchNoticeBoardEntries, deleteNoticeBoardEntry } from '@/api/services/notice-board-service'
import { EmptyState } from '@/components/ui/empty-state'
import { NoticeCard, NoticeDetailBoard } from '@/features/notice-board/components'
import { GridPagination } from '@/components/pagination/GridPagination'
import type { NoticeBoardEntry, NoticeCategory } from '@/features/notice-board/types'

type SortOption = 'latest' | 'oldest'

const CATEGORIES: NoticeCategory[] = [
  'Academic',
  'Events',
  'Maintenance',
  'Arts',
  'Finance',
  'Notice',
  'Training',
  'Announcement',
]

export default function NoticeBoard() {
  const isDesktop = useIsDesktop()

  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedNotice, setSelectedNotice] = React.useState<NoticeBoardEntry | null>(null)
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [sortOption, setSortOption] = React.useState<SortOption>('latest')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(9)

  React.useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const data = await fetchNoticeBoardEntries()
        setNotices(data)
      } catch (error) {
        console.error('Failed to fetch notices:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredAndSorted = React.useMemo(() => {
    let filtered = notices

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n =>
        n.tags.some(t => t.label === categoryFilter),
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'latest') {
        return b.id.localeCompare(a.id)
      }
      return a.id.localeCompare(b.id)
    })

    return sorted
  }, [notices, categoryFilter, sortOption])

  const paginatedNotices = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAndSorted.slice(start, start + pageSize)
  }, [filteredAndSorted, currentPage, pageSize])

  React.useEffect(() => {
    setCurrentPage(1)
    if (isDesktop && filteredAndSorted.length > 0) {
      setSelectedNotice(filteredAndSorted[0])
    } else if (filteredAndSorted.length === 0) {
      setSelectedNotice(null)
    }
  }, [categoryFilter, sortOption])

  // Auto-select first notice on desktop once data is loaded
  React.useEffect(() => {
    if (isDesktop && filteredAndSorted.length > 0 && !selectedNotice) {
      setSelectedNotice(filteredAndSorted[0])
    }
  }, [isDesktop, filteredAndSorted, selectedNotice])

  const handleNoticeClick = React.useCallback((notice: NoticeBoardEntry) => {
    setSelectedNotice(notice)
  }, [])

  const handleCloseDetail = React.useCallback(() => {
    setSelectedNotice(null)
  }, [])

  const handleDeleteNotice = React.useCallback(async (id: string) => {
    await deleteNoticeBoardEntry(id)
    setNotices(prev => prev.filter(n => n.id !== id))
    setSelectedNotice(null)
  }, [])

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notice Board"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Notice Board' },
        ]}
      />

      {/* Main content area */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className={isDesktop ? 'flex gap-4 items-start' : ''}>
          {/* Left column: toolbar + notice list */}
          <div className={isDesktop ? 'flex-1 min-w-0 space-y-3' : 'space-y-3'}>
            {/* Toolbar - sits above the list only */}
            <Tile
              id="notice-board-toolbar"
              layoutMode="block"
              background="default"
              borderRadius="lg"
              shadowed={false}
              padding="p-3"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-section-title" style={{ color: text.heading }}>
                  Notice Board
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger
                      className="h-8 w-[140px]"
                      style={{
                        backgroundColor: baseColors.blue,
                        color: text.heading,
                        borderColor: baseColors.blue,
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by</span>
                    <Select value={sortOption} onValueChange={v => setSortOption(v as SortOption)}>
                      <SelectTrigger
                        className="h-8 w-[100px]"
                        style={{
                          backgroundColor: baseColors.blue,
                          color: text.heading,
                          borderColor: baseColors.blue,
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Tile>

            {/* Notice cards */}
            {paginatedNotices.length === 0 ? (
              <Tile
                id="notice-board-empty"
                layoutMode="block"
                background="card"
                borderRadius="lg"
                shadowed={false}
                className="border"
              >
                <EmptyState
                  icon={<ClipboardList />}
                  title={notices.length === 0 ? 'No Notices Yet' : 'No Notices Found'}
                  description={
                    notices.length === 0
                      ? 'There are no notices to display. Create one to get started.'
                      : 'No notices match the selected category. Try changing the filter.'
                  }
                />
              </Tile>
            ) : (
              paginatedNotices.map(notice => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  isSelected={selectedNotice?.id === notice.id}
                  onClick={handleNoticeClick}
                />
              ))
            )}

            {/* Pagination */}
            {filteredAndSorted.length > 0 && (
              <GridPagination
                currentPage={currentPage}
                totalItems={filteredAndSorted.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[9, 18, 27]}
              />
            )}
          </div>

          {/* Detail panel - desktop: sticky side panel */}
          {isDesktop && selectedNotice && (
            <div className="w-[380px] flex-shrink-0 sticky top-4">
              <NoticeDetailBoard
                notice={selectedNotice}
                onClose={handleCloseDetail}
                onDelete={handleDeleteNotice}
                showClose={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Detail panel - mobile/tablet: sliding Sheet */}
      {!isDesktop && (
        <Sheet
          open={!!selectedNotice}
          onOpenChange={open => { if (!open) handleCloseDetail() }}
        >
          <SheetContent side="right" size="md" className="p-0 [&>button]:hidden">
            {selectedNotice && (
              <NoticeDetailBoard
                notice={selectedNotice}
                onClose={handleCloseDetail}
                onDelete={handleDeleteNotice}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
