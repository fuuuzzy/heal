import { Component, type ReactNode } from 'react'
import { WarningCircleIcon } from './Icons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-3">
            <WarningCircleIcon className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-txt-muted">页面出错了</p>
          <button onClick={() => this.setState({ hasError: false })} className="btn-secondary text-xs mt-3">
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
