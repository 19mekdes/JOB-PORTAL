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

// ✅ FIXED REGISTER ACTION
export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, thunkAPI) => {
    try {
      const response = await authService.register(userData)
      
      if (response.success && response.user) {
        authService.storeUserData(response.user, response.token, response.refreshToken)
        return response.user
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isError = false
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
        state.user = action.payload // Now receives the direct user payload clean of wrappers
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload as string
        state.user = null
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.isError = false
        state.isSuccess = false
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload
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

export const { reset } = authSlice.actions
export default authSlice.reducer