/**
 * YEOSKIN DASHBOARD - Error Boundary Component
 * ============================================================================
 * Global error boundary for catching unhandled React errors
 * Prevents full app crash and provides recovery options
 * Fixed: Pre-import supabase to avoid async import in error handler
 * ============================================================================
 */

import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Error Boundary - Class component required for componentDidCatch
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    }
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and state
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Log to audit system if available
    this.logErrorToAudit(error, errorInfo)
  }

  logErrorToAudit = async (error, errorInfo) => {
    // Use timeout to prevent hanging if supabase is unavailable
    const logPromise = async () => {
      const { data: user } = await supabase.auth.getUser()

      await supabase.from('audit_logs').insert({
        user_id: user?.user?.id,
        user_email: user?.user?.email,
        action: 'ERROR',
        resource_type: 'system',
        metadata: {
          error_message: error?.message,
          error_stack: error?.stack,
          component_stack: errorInfo?.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      })
    }

    try {
      // Add 5 second timeout to prevent hanging
      await Promise.race([
        logPromise(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Audit log timeout')), 5000)
        )
      ])
    } catch (logError) {
      // Silent fail - don't crash error boundary
      console.error('Failed to log error to audit:', logError)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleCopyError = () => {
    const errorText = `
Error: ${this.state.error?.message}

Stack Trace:
${this.state.error?.stack}

Component Stack:
${this.state.errorInfo?.componentStack}

URL: ${window.location.href}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim()

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            {/* Error Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-danger-500" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Une erreur est survenue
              </h1>

              {/* Description */}
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                L'application a rencontre un probleme inattendu.
                Vos donnees sont en securite.
              </p>

              {/* Error Details (collapsible) */}
              <details className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Details techniques
                </summary>
                <div className="px-4 pb-4">
                  <div className="bg-danger-50 dark:bg-danger-900/20 rounded-lg p-3 mb-3">
                    <p className="text-sm font-mono text-danger-700 dark:text-danger-300 break-all">
                      {this.state.error?.message || 'Unknown error'}
                    </p>
                  </div>

                  {this.state.error?.stack && (
                    <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto max-h-40 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded p-2">
                      {this.state.error.stack}
                    </pre>
                  )}

                  {/* Copy Error Button */}
                  <button
                    onClick={this.handleCopyError}
                    className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    {this.state.copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copie !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copier l'erreur
                      </>
                    )}
                  </button>
                </div>
              </details>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recharger la page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  Retour a l'accueil
                </button>
              </div>

              {/* Support Link */}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Si le probleme persiste, contactez{' '}
                <a
                  href="mailto:support@yeoskin.com"
                  className="text-primary-600 hover:underline"
                >
                  le support
                </a>
              </p>
            </div>

            {/* App Version */}
            <p className="text-center text-xs text-gray-400 mt-4">
              Yeoskin Dashboard v1.0.0
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (WrappedComponent, fallback = null) => {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Hook to trigger error boundary (for functional components)
 */
export const useErrorHandler = () => {
  return (error) => {
    throw error
  }
}

export default ErrorBoundary
