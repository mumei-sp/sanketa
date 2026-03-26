/**
 * useAppToast — reusable toast notification hook.
 *
 * Wraps Sonner's `toast` with consistent styling and patterns
 * so all toasts across the app look and behave the same.
 *
 * @example
 * const { showSuccess, showError, showInfo } = useAppToast()
 * showSuccess('Settings saved')
 * showError('Failed to save settings')
 * showInfo('No changes detected')
 */

import { toast } from 'sonner'

interface AppToastOptions {
  /** Optional description below the title */
  description?: string
  /** Duration in ms (default: 3000) */
  duration?: number
}

export function useAppToast() {
  const showSuccess = (message: string, options?: AppToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
    })
  }

  const showError = (message: string, options?: AppToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
    })
  }

  const showInfo = (message: string, options?: AppToastOptions) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
    })
  }

  const showWarning = (message: string, options?: AppToastOptions) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    })
  }

  const showLoading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId)
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
  }
}
