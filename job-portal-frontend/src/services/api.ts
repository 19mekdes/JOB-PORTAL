/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// ========== TYPES ==========
export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

// ========== CONFIGURATION ==========
// Dynamic API URL that works on both PC and phone
const getApiUrl = () => {
  // Check if we're on localhost (PC development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Use the environment variable or default to localhost
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  
  // On phone or network access - use the same hostname but port 5000
  // This works because the phone accesses via PC's IP address
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

const API_URL = getApiUrl();
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

console.log('[API] Base URL:', API_URL); // Debug log

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ========== PUBLIC ENDPOINTS (No redirect on 401) ==========
const PUBLIC_ENDPOINTS = [
  '/jobs',
  '/jobs/',
  '/home/stats',
  '/public-settings',
  '/industries',
  '/companies/top',
  '/auth/login',
  '/auth/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact'
]

const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint))
}

// ========== REQUEST INTERCEPTOR ==========
// Add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Try multiple token locations
    let token = localStorage.getItem('token')
    
    if (!token) {
      token = localStorage.getItem('admin_token')
    }
    
    // Also check for user object
    if (!token) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          token = user.token || user.accessToken
        } catch (e) {
          console.error('Error parsing user:', e)
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      if (import.meta.env.DEV && !isPublicEndpoint(config.url)) {
        console.log(`[API] 🔐 Token attached for: ${config.url}`)
      }
    } else if (!isPublicEndpoint(config.url)) {
      console.log(`[API] ⚠️ No token for: ${config.url}`)
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// ========== RESPONSE INTERCEPTOR ==========
// Handle responses and errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const isPublic = isPublicEndpoint(originalRequest.url)
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', error.response?.status, error.response?.data, 'Public endpoint:', isPublic)
    }
    
    // ========== HANDLE 401 UNAUTHORIZED ==========
    if (error.response?.status === 401) {
      // For public endpoints, DON'T redirect - just return empty data
      if (isPublic) {
        console.log('[API] Public endpoint 401, returning empty response')
        // Return a mock successful response with empty data
        return Promise.resolve({
          data: {
            success: true,
            data: [],
            message: 'Public endpoint accessed without auth'
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest
        } as AxiosResponse)
      }
      
      // For protected endpoints, try to refresh token
      if (!originalRequest._retry) {
        originalRequest._retry = true
        
        // Attempt to refresh token
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refresh_token: refreshToken
            })
            
            const { token } = response.data
            
            // Update user in localStorage
            const userStr = localStorage.getItem('user')
            if (userStr) {
              const user = JSON.parse(userStr)
              user.token = token
              localStorage.setItem('user', JSON.stringify(user))
            }
            
            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
        
        // Clear local storage and redirect to login
        localStorage.removeItem('user')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('token')
        localStorage.removeItem('admin_token')
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login'
        }
      }
    }
    
    // ========== HANDLE 403 FORBIDDEN ==========
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response?.data)
      // Don't redirect for public endpoints
      if (!isPublic && window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized'
      }
    }
    
    // Format error message
    const apiError: ApiError = {
      message: (error.response?.data as any)?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      errors: (error.response?.data as any)?.errors,
    }
    
    return Promise.reject(apiError)
  }
)

// ========== HELPER FUNCTIONS ==========

// Generic GET request
export const get = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.get<T>(url, config)
  return response.data
}

// Generic POST request
export const post = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.post<T>(url, data, config)
  return response.data
}

// Generic PUT request
export const put = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.put<T>(url, data, config)
  return response.data
}

// Generic PATCH request
export const patch = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.patch<T>(url, data, config)
  return response.data
}

// Generic DELETE request
export const del = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.delete<T>(url, config)
  return response.data
}

export default api