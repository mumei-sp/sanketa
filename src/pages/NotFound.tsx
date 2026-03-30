import { Link } from 'react-router-dom'
import { text, accent, background, border } from '@/theme/colors'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: background.page,
      }}
    >
      <h1
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: accent.base,
          margin: 0,
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: text.heading,
          margin: '16px 0 8px',
        }}
      >
        Page not found
      </h2>
      <p
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: text.muted,
          margin: '0 0 32px',
          maxWidth: 400,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 500,
            color: 'white',
            backgroundColor: accent.base,
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          <Home size={14} />
          Go to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 500,
            color: text.heading,
            backgroundColor: background.card,
            border: `1px solid ${border.default}`,
            borderRadius: 8,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
      </div>
    </div>
  )
}
