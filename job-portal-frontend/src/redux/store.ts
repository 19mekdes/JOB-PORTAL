import { configureStore, combineReducers } from '@reduxjs/toolkit'

import authReducer from './slices/authSlice'
import jobReducer from './slices/jobSlice'
import applicationReducer from './slices/applicationSlice'
import notificationReducer from './slices/notificationSlice'
import bookmarkReducer from './slices/bookmarkSlice'
import uiReducer from './slices/uiSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobReducer,
  applications: applicationReducer,
  notifications: notificationReducer,
  bookmarks: bookmarkReducer,
  ui: uiReducer,
})


const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
})


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export { store }
export default store