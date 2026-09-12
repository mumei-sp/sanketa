/**
 * useAppToast — reusable toast notification hook.
 *
 * Wraps Sonner's `toast` with consistent styling and patterns
 * so all toasts across the app look and behave the same.
 *
 * All returned functions are stable references (useCallback)
 * so they can safely be used in dependency arrays.
 *
 * @example
 * const { showSuccess, showError, showInfo } = useAppToast()
 * showSuccess('Settings saved')
 * showError('Failed to save settings')
 * showInfo('No changes detected')
 */

import * as React from 'react'
import { toast } from 'sonner'

interface AppToastOptions {
  /** Optional description below the title */
  description?: string
  /** Duration in ms (default: 3000) */
  duration?: number
  /**
   * A stable id, so repeats REPLACE rather than stack.
   *
   * Six panels failing the same way is one piece of news. Without an id each
   * gets its own toast and the screen is buried in six copies of it.
   */
  id?: string | number
}

export function useAppToast() {
  const showSuccess = React.useCallback((message: string, options?: AppToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      id: options?.id,
    })
  }, [])

  const showError = React.useCallback((message: string, options?: AppToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      id: options?.id,
    })
  }, [])

  const showInfo = React.useCallback((message: string, options?: AppToastOptions) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      id: options?.id,
    })
  }, [])

  const showWarning = React.useCallback((message: string, options?: AppToastOptions) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      id: options?.id,
    })
  }, [])

  const showLoading = React.useCallback((message: string) => {
    return toast.loading(message)
  }, [])

  const dismiss = React.useCallback((toastId?: string | number) => {
    toast.dismiss(toastId)
  }, [])

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
  }
}
