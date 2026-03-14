import { noticeBoardEntries } from '@/features/notice-board/mocks'
import type { NoticeBoardEntry } from '@/features/notice-board/types'

function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 300) + 200
  return new Promise(resolve => setTimeout(resolve, delay))
}

export async function fetchNoticeBoardEntries(): Promise<NoticeBoardEntry[]> {
  await randomDelay()
  return [...noticeBoardEntries]
}
