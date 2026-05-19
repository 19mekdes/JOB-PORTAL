import { combineReducers } from '@reduxjs/toolkit'

// Import all slices
import authReducer from './slices/authSlice'
import jobReducer from './slices/jobSlice'
import applicationReducer from './slices/applicationSlice'
import notificationReducer from './slices/notificationSlice'
import bookmarkReducer from './slices/bookmarkSlice'
import uiReducer from './slices/uiSlice'

// Root reducer combining all slices
const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobReducer,
  applications: applicationReducer,
  notifications: notificationReducer,
  bookmarks: bookmarkReducer,
  ui: uiReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer