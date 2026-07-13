import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in Tacked UI:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="min-h-screen bg-canvas flex items-center justify-center p-6">
          <div className="max-w-sm text-center flex flex-col items-center gap-3">
            <p className="text-[17px] font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Something went wrong
            </p>
            <p className="text-[13px] text-ink-muted">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-1 px-4 py-2 rounded-button bg-accent-btn text-white text-[13px] font-medium hover:bg-accent-btn-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
