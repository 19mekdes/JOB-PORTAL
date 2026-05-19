/* eslint-disable react-refresh/only-export-components */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home, Mail, Bug, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  resetOnRouteChange?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo
    })
    
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // You could also send error to logging service here
    // this.logErrorToService(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when route changes if resetOnRouteChange is true
    if (this.props.resetOnRouteChange && prevProps.children !== this.props.children && this.state.hasError) {
      this.resetError()
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoBack = (): void => {
    window.history.back()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  handleReportBug = (): void => {
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message || 'Application Error'}`)
    const body = encodeURIComponent(`
      Error: ${this.state.error?.message || 'Unknown error'}
      Stack: ${this.state.error?.stack || 'No stack trace'}
      Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
      URL: ${window.location.href}
      User Agent: ${navigator.userAgent}
      Timestamp: ${new Date().toISOString()}
    `)
    window.location.href = `mailto:support@jobportal.com?subject=${subject}&body=${body}`
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, showDetails = false } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 via-white to-gray-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-600">
                Something Went Wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Message */}
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error?.message || "An unknown error occurred"}
                </AlertDescription>
              </Alert>

              {/* Error Details (for development) */}
              {showDetails && import.meta.env.DEV && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Error Details:</p>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-60">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {error?.stack}
                    </pre>
                    {errorInfo && (
                      <>
                        <div className="h-px bg-gray-700 my-2" />
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">What can you do?</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Try refreshing the page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronLeft className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Go back to the previous page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Home className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Return to the homepage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Contact support if the problem persists</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={this.handleGoBack} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button variant="outline" onClick={this.handleReload} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardFooter>
            
            <div className="px-6 pb-6 text-center">
              <Button
                variant="link"
                size="sm"
                onClick={this.handleReportBug}
                className="text-gray-500"
              >
                <Bug className="h-3 w-3 mr-1" />
                Report this issue
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return children
  }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
}

// Hook to use error boundary context (optional)
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = (error: Error) => {
    setError(error)
    console.error('Caught error:', error)
  }

  const resetError = () => {
    setError(null)
  }

  return { error, handleError, resetError }
}

// Inline Error Boundary for specific components
export class ErrorBoundaryInline extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Inline ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-gray-600">Something went wrong in this section.</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2"
          >
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary