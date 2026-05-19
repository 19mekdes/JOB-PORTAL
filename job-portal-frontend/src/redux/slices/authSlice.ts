/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/authService'

interface AuthState {
  user: any | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  message: string
}

// Get user from localStorage only once on app load
const getUserFromStorage = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

const initialState: AuthState = {
  user: getUserFromStorage(),
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: ''
}

// ✅ LOGIN ACTION
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authService.login(email, password)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
  }
)

// ✅ REGISTER ACTION - ADD THIS
export const register = createAsyncThunk(
  'auth/register',
  async (userData: any) => {
    const response = await authService.register(userData)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
  }
)

// ✅ LOGOUT ACTION
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('user')
  return null
})

// ✅ GET CURRENT USER ACTION
export const getMe = createAsyncThunk('auth/getMe', async () => {
  const response = await authService.getMe()
  return response
})

// ✅ UPDATE PROFILE ACTION
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any) => {
    const response = await authService.updateProfile(profileData)
    localStorage.setItem('user', JSON.stringify(response))
    return response
  }
)

// ✅ CHANGE PASSWORD ACTION
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ current_password, new_password }: { current_password: string; new_password: string }) => {
    const response = await authService.changePassword(current_password, new_password)
    return response
  }
)

// ✅ FORGOT PASSWORD ACTION
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string) => {
    const response = await authService.forgotPassword(email)
    return response
  }
)

// ✅ RESET PASSWORD ACTION
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, new_password }: { token: string; new_password: string }) => {
    const response = await authService.resetPassword(token, new_password)
    return response
  }
)

// ✅ VERIFY EMAIL ACTION
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string) => {
    const response = await authService.verifyEmail(token)
    return response
  }
)

// ✅ RESEND VERIFICATION ACTION
export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email: string) => {
    const response = await authService.resendVerification(email)
    return response
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isError = false
      state.isSuccess = false
      state.message = ''
    },
    clearUser: (state) => {
      state.user = null
      localStorage.removeItem('user')
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.isError = false
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.error.message || 'Login failed'
        state.user = null
        localStorage.removeItem('user')
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.isError = false
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload.user
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.error.message || 'Registration failed'
        state.user = null
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isSuccess = false
        state.isError = false
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false
        state.user = null
        localStorage.removeItem('user')
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
      // Change Password
      .addCase(changePassword.fulfilled, (state) => {
        state.isSuccess = true
        state.message = 'Password changed successfully'
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isError = true
        state.message = action.error.message || 'Failed to change password'
      })
      // Forgot Password
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isSuccess = true
        state.message = 'Password reset email sent'
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isError = true
        state.message = action.error.message || 'Failed to send reset email'
      })
      // Reset Password
      .addCase(resetPassword.fulfilled, (state) => {
        state.isSuccess = true
        state.message = 'Password reset successfully'
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isError = true
        state.message = action.error.message || 'Failed to reset password'
      })
      // Verify Email
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isSuccess = true
        state.message = 'Email verified successfully'
        if (state.user) {
          state.user.email_verified = true
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isError = true
        state.message = action.error.message || 'Failed to verify email'
      })
      // Resend Verification
      .addCase(resendVerification.fulfilled, (state) => {
        state.isSuccess = true
        state.message = 'Verification email sent'
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.isError = true
        state.message = action.error.message || 'Failed to send verification email'
      })
  }
})

export const { reset, clearUser } = authSlice.actions
export default authSlice.reducer