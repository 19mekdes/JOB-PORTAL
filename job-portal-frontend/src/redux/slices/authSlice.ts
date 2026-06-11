/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService, { LoginCredentials } from '../../services/authService'

interface AuthState {
  user: any | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  message: string
}

const initialState: AuthState = {
  // Use your service's built-in helper to sync user on page loads/refreshes
  user: authService.getStoredUser(), 
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: ''
}

// ✅ FIXED LOGIN ACTION
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }: LoginCredentials, thunkAPI) => {
    try {
      const response = await authService.login(email, password, rememberMe)
      
      if (response.success && response.user) {
        // Use your service's helper function to structure and save user + token data
        authService.storeUserData(response.user, response.token, response.refreshToken)
        return response.user
      } else {
        return thunkAPI.rejectWithValue(response.message || 'Login failed')
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Server error during login'
      return thunkAPI.rejectWithValue(msg)
    }
  }
)

// ✅ FIXED REGISTER ACTION - NO AUTO LOGIN
export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, thunkAPI) => {
    try {
      const response = await authService.register(userData)
      
      // ✅ IMPORTANT: Only return success, NOT user data
      if (response.success) {
        // ✅ DO NOT store user data - just return success message
        return { success: true, message: 'Registration successful! Please login.' }
      } else {
        return thunkAPI.rejectWithValue(response.message || 'Registration failed')
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Server error during registration'
      return thunkAPI.rejectWithValue(msg)
    }
  }
)

// ✅ LOGOUT ACTION
export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout()
  return null
})

// ✅ GET CURRENT USER ACTION
export const getMe = createAsyncThunk('auth/getMe', async () => {
  const response = await authService.getMe()
  return response
})

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, thunkAPI) => {
    try {
      const response = await authService.updateProfile(profileData)
      return response
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to update profile')
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ current_password, new_password }: { current_password: string; new_password: string }, thunkAPI) => {
    try {
      const response = await authService.changePassword(current_password, new_password)
      return response
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to change password')
    }
  }
)

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, thunkAPI) => {
    try {
      const response = await authService.forgotPassword(email)
      return response
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to send reset email')
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, new_password }: { token: string; new_password: string }, thunkAPI) => {
    try {
      const response = await authService.resetPassword(token, new_password)
      return response
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to reset password')
    }
  }
)

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, thunkAPI) => {
    try {
      const response = await authService.verifyEmail(token)
      return response
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to verify email')
    }
  }
)

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email: string, thunkAPI) => {
    try {
      const response = await authService.resendVerification(email)
      return response
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to resend verification email')
    }
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
    // ✅ Add a clearSuccess action
    clearSuccess: (state) => {
      state.isSuccess = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.isError = false
        state.isSuccess = false
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload as string
        state.user = null
      })
      // ✅ FIXED REGISTER - DO NOT set user
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.isError = false
        state.isSuccess = false
        state.message = ''
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        // ✅ IMPORTANT: Do NOT set state.user here
        // state.user remains null (user needs to login)
        state.message = action.payload.message || 'Registration successful!'
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload as string
        state.user = null
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isSuccess = false
        state.isError = false
        state.message = ''
      })
      // Get Me
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
  }
})

export const { reset, clearSuccess } = authSlice.actions
export default authSlice.reducer