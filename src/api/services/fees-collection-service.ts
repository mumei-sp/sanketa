import type {
  FeeStat,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
} from '@/features/fees-collection/types'
import {
  feeStats,
  feeTrendData,
  feeProgressData,
  feeCollectionData,
} from '@/features/fees-collection/mocks'

function randomDelay(): number {
  return Math.floor(Math.random() * 500) + 300
}

export async function fetchFeeStats(): Promise<FeeStat[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...feeStats])
    }, randomDelay())
  })
}

export async function fetchFeeTrend(): Promise<FeeTrendData[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...feeTrendData])
    }, randomDelay())
  })
}

export async function fetchFeeProgress(): Promise<FeeProgressData[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...feeProgressData])
    }, randomDelay())
  })
}

export async function fetchFeeCollection(): Promise<FeeCollectionRecord[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...feeCollectionData])
    }, randomDelay())
  })
}
