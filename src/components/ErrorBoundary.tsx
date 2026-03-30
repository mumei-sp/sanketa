import { Component, type ErrorInfo, type ReactNode } from 'react'
import { text, background, border, accent } from '@/theme/colors'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: text.heading,
              margin: '0 0 8px',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: text.muted,
              margin: '0 0 24px',
              maxWidth: 400,
            }}
          >
            An unexpected error occurred. Try refreshing the page or click below to recover.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: 11,
                color: text.muted,
                backgroundColor: background.surface,
                border: `1px solid ${border.subtle}`,
                borderRadius: 8,
                padding: '12px 16px',
                maxWidth: 500,
                overflow: 'auto',
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              color: 'white',
              backgroundColor: accent.base,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
