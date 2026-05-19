import { configureStore, combineReducers } from '@reduxjs/toolkit'

// Import slices
import authReducer from './slices/authSlice'
import jobReducer from './slices/jobSlice'
import applicationReducer from './slices/applicationSlice'
import notificationReducer from './slices/notificationSlice'
import bookmarkReducer from './slices/bookmarkSlice'
import uiReducer from './slices/uiSlice'

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobReducer,
  applications: applicationReducer,
  notifications: notificationReducer,
  bookmarks: bookmarkReducer,
  ui: uiReducer,
})

// Configure store without persistence
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
})

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export store
export { store }
export default store