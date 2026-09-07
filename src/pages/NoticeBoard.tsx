import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import {
  ListToolbar,
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_FILTER_CONTROL,
  TOOLBAR_PRIMARY_ACTION,
} from '@/components/table'
import { cn } from '@/lib/utils'
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
import { text } from '@/theme/colors'
import { useIsDesktop } from '@/hooks/use-mobile'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { fetchNoticeBoardEntries, deleteNoticeBoardEntry, createNoticeBoardEntry, updateNoticeBoardEntry, incrementNoticeViews, toggleNoticePin } from '@/api/services/notice-board-service'
import { useAppToast } from '@/hooks/use-app-toast'
import { EmptyState } from '@/components/ui/empty-state'
import { NoticeCard, NoticeDetailBoard, CreateNoticeForm } from '@/features/notice-board/components'
import type { NoticeFormValues } from '@/features/notice-board/schemas/notice-schema'
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

function parseDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function entryToFormValues(entry: NoticeBoardEntry): NoticeFormValues & { id: string } {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    category: entry.tags[0]?.label || '',
    audience: entry.audience,
    status: entry.status,
    postDate: parseDisplayDate(entry.postDate) || new Date().toISOString(),
    dateLabel: entry.dateLabel || 'Due Date',
    dateValue: parseDisplayDate(entry.expiryDate),
    dateEndValue: parseDisplayDate(entry.dateEndValue || ''),
    thumbnail: entry.thumbnail,
    pinned: entry.pinned ?? false,
  }
}

export default function NoticeBoard() {
  const isDesktop = useIsDesktop()
  const { showSuccess } = useAppToast()

  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedNotice, setSelectedNotice] = React.useState<NoticeBoardEntry | null>(null)
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [sortOption, setSortOption] = React.useState<SortOption>('latest')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(9)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingNotice, setEditingNotice] = React.useState<NoticeBoardEntry | null>(null)

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
      // Pinned notices always come first
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1

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
    if (isDesktop && filteredAndSorted.length > 0 && !selectedNotice && !isCreateOpen && !editingNotice) {
      setSelectedNotice(filteredAndSorted[0])
    }
  }, [isDesktop, filteredAndSorted, selectedNotice, isCreateOpen, editingNotice])

  const handleNoticeClick = React.useCallback((notice: NoticeBoardEntry) => {
    setSelectedNotice(notice)
    incrementNoticeViews(notice.id).then(newCount => {
      setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, views: newCount } : n))
      setSelectedNotice(prev => prev && prev.id === notice.id ? { ...prev, views: newCount } : prev)
    })
  }, [])

  const handleCloseDetail = React.useCallback(() => {
    setSelectedNotice(null)
  }, [])

  const handleDeleteNotice = React.useCallback(async (id: string) => {
    await deleteNoticeBoardEntry(id)
    setNotices(prev => prev.filter(n => n.id !== id))
    setSelectedNotice(null)
  }, [])

  const handleTogglePin = React.useCallback(async (id: string) => {
    const updated = await toggleNoticePin(id)
    setNotices(prev => prev.map(n => n.id === id ? updated : n))
    setSelectedNotice(prev => prev && prev.id === id ? updated : prev)
    showSuccess(updated.pinned ? 'Notice pinned' : 'Notice unpinned')
  }, [showSuccess])

  const handleCreateNotice = React.useCallback(async (data: NoticeFormValues) => {
    const newEntry = await createNoticeBoardEntry(data)
    setNotices(prev => [newEntry, ...prev])
    setIsCreateOpen(false)
    setSelectedNotice(newEntry)
  }, [])

  const handleEditNotice = React.useCallback((notice: NoticeBoardEntry) => {
    setSelectedNotice(null)
    setEditingNotice(notice)
  }, [])

  const handleUpdateNotice = React.useCallback(async (data: NoticeFormValues) => {
    if (!editingNotice) return
    const updated = await updateNoticeBoardEntry(editingNotice.id, data)
    setNotices(prev => prev.map(n => n.id === updated.id ? updated : n))
    setEditingNotice(null)
    setSelectedNotice(updated)
  }, [editingNotice])

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
        <div className={isDesktop ? 'flex gap-4 items-start' : ''}>
          {/* Left column: toolbar + notice list skeleton */}
          <div className={isDesktop ? 'flex-1 min-w-0 space-y-3' : 'space-y-3'}>
            {/* Toolbar skeleton */}
            <Tile
              id="notice-board-toolbar-skeleton"
              layoutMode="block"
              background="default"
              borderRadius="lg"
              shadowed={false}
              padding="p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-[100px]" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-[140px] rounded-md" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-[40px]" />
                    <Skeleton className="h-8 w-[100px] rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-[80px] rounded-md" />
                </div>
              </div>
            </Tile>

            {/* Notice card skeletons */}
            {[1, 2, 3, 4, 5].map(i => (
              <Tile
                key={i}
                id={`notice-skeleton-${i}`}
                layoutMode="block"
                background="card"
                borderRadius="lg"
                shadowed={false}
                padding="p-4"
                className="border"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <Skeleton className="size-[52px] min-w-[52px] rounded-lg" />
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-3/5" />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-3 w-[50px]" />
                          <Skeleton className="h-3 w-[80px]" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-3 w-[50px]" />
                          <Skeleton className="h-3 w-[80px]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right space-y-1">
                        <Skeleton className="h-3 w-[80px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                      <Skeleton className="h-6 w-[60px] rounded-full" />
                    </div>
                  </div>
                </div>
              </Tile>
            ))}
          </div>

          {/* Detail panel skeleton - desktop only */}
          {isDesktop && (
            <div className="w-[380px] flex-shrink-0 sticky top-4">
              <Tile
                id="notice-detail-skeleton"
                layoutMode="block"
                background="card"
                borderRadius="lg"
                shadowed={false}
                padding="p-5"
                className="border"
              >
                <div className="space-y-4">
                  {/* Image placeholder */}
                  <Skeleton className="h-[160px] w-full rounded-lg" />
                  {/* Status + views */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-[60px] rounded-full" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                  {/* Title */}
                  <Skeleton className="h-5 w-4/5" />
                  {/* Author */}
                  <Skeleton className="h-3.5 w-[140px]" />
                  {/* Meta rows */}
                  <div className="space-y-3 pt-2">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-[70px]" />
                        <Skeleton className="h-3.5 w-[140px]" />
                      </div>
                    ))}
                  </div>
                  {/* Content lines */}
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-3.5 w-[60px]" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <Skeleton className="h-8 w-[70px] rounded-md" />
                    <Skeleton className="h-8 w-[70px] rounded-md" />
                    <Skeleton className="h-8 w-[70px] rounded-md" />
                  </div>
                </div>
              </Tile>
            </div>
          )}
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
              <ListToolbar
                title={
                  // Labels the list column of the desktop split. Without the
                  // split there is only one column, and the heading would just
                  // repeat the PageHeader two lines above it.
                  isDesktop ? (
                    <h2 className="text-section-title" style={{ color: 'var(--heading)' }}>
                      Notice Board
                    </h2>
                  ) : undefined
                }
                filters={[
                  {
                    id: 'category',
                    label: 'Category',
                    isActive: categoryFilter !== 'all',
                    control: (
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger
                          className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-[140px]', TOOLBAR_FILTER_CONTROL)}
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: text.heading,
                            borderColor: 'var(--accent)',
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
                    ),
                  },
                  {
                    id: 'sort',
                    label: 'Sort by',
                    inlineLabel: true,
                    isActive: sortOption !== 'latest',
                    control: (
                      <Select value={sortOption} onValueChange={v => setSortOption(v as SortOption)}>
                        <SelectTrigger
                          className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-[100px]', TOOLBAR_FILTER_CONTROL)}
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: text.heading,
                            borderColor: 'var(--accent)',
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Latest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    ),
                  },
                ]}
                primaryAction={
                  <Button
                    size="sm"
                    // No search field on this list, so on a phone the action is
                    // the only thing on its row — it takes the width rather
                    // than sitting as a stub at one end.
                    className={cn(
                      TOOLBAR_PRIMARY_ACTION,
                      'gap-1.5 px-4 font-semibold text-sm md:ml-2 max-md:w-full',
                    )}
                    onClick={() => { setSelectedNotice(null); setIsCreateOpen(true) }}
                  >
                    <Plus className="size-4" />
                    Create
                  </Button>
                }
              />
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
                  action={
                    notices.length === 0 ? (
                      <Button size="sm" className="gap-1.5" onClick={() => { setSelectedNotice(null); setIsCreateOpen(true) }}>
                        <Plus className="size-3.5" />
                        Create Notice
                      </Button>
                    ) : undefined
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
                  onTogglePin={handleTogglePin}
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
                onEdit={handleEditNotice}
                onTogglePin={handleTogglePin}
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
                onEdit={handleEditNotice}
                onTogglePin={handleTogglePin}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
      {/* Create Notice - Sheet up to sidebar edge */}
      <Sheet open={isCreateOpen} onOpenChange={open => { if (!open) setIsCreateOpen(false) }}>
        <SheetContent side="right" size="full" className="p-0 w-full md:w-[calc(100vw-16rem)] [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Create Notice</SheetTitle>
          </SheetHeader>
          <CreateNoticeForm
            onSubmit={handleCreateNotice}
            onCancel={() => setIsCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Edit Notice - Sheet up to sidebar edge */}
      <Sheet open={!!editingNotice} onOpenChange={open => { if (!open) setEditingNotice(null) }}>
        <SheetContent side="right" size="full" className="p-0 w-full md:w-[calc(100vw-16rem)] [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Edit Notice</SheetTitle>
          </SheetHeader>
          {editingNotice && (
            <CreateNoticeForm
              key={editingNotice.id}
              onSubmit={handleUpdateNotice}
              onCancel={() => setEditingNotice(null)}
              initialData={entryToFormValues(editingNotice)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
