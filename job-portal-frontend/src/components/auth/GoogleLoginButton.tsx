import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface GoogleLoginButtonProps {
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
  text?: string
  className?: string
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  text = 'Continue with Google',
  className = ''
}) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = () => {
    setIsLoading(true)
    
    // Open popup for Google login
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `${API_URL}/auth/google`,
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      setIsLoading(false)
      onError?.('Popup blocked. Please allow popups for this site.')
      return
    }

    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, user } = event.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        onSuccess?.(user)
        popup.close()
        window.removeEventListener('message', handleMessage)
        setIsLoading(false)
        navigate('/dashboard')
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        onError?.(event.data.error)
        popup.close()
        window.removeEventListener('message', handleMessage)
        setIsLoading(false)
      }
    }

    window.addEventListener('message', handleMessage)

    // Cleanup if popup closes
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup)
        window.removeEventListener('message', handleMessage)
        setIsLoading(false)
      }
    }, 1000)
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`flex items-center justify-center gap-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {text}
        </>
      )}
    </button>
  )
}

export default GoogleLoginButton