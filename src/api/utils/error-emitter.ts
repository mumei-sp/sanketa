import type { ApiError } from '../types'

type ErrorHandler = (error: ApiError) => void

class ErrorEmitter {
  private handlers: Set<ErrorHandler> = new Set()

  /**
   * Register an error handler
   * @param handler Function to call when an error occurs
   * @returns Unsubscribe function
   */
  onError(handler: ErrorHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  /**
   * Emit an error to all registered handlers
   * @param error The API error to emit
   */
  emit(error: ApiError): void {
    this.handlers.forEach(handler => {
      try {
        handler(error)
      } catch (err) {
        console.error('Error in error handler:', err)
      }
    })
  }

  /**
   * Remove all error handlers
   */
  clear(): void {
    this.handlers.clear()
  }
}

export const errorEmitter = new ErrorEmitter()
