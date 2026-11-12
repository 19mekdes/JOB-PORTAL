import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ModalType = 'confirm' | 'alert' | 'prompt' | 'custom'

export interface Toast {
  id?: string
  message: string
  type: ToastType
  duration?: number
  title?: string
}

export interface Modal {
  id?: string
  type: ModalType
  title: string
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

export interface DrawerConfig {
  isOpen: boolean
  content?: React.ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'left' | 'right'
}

export interface LoadingState {
  global: boolean
  page: boolean
  actions: Record<string, boolean>
}

interface UIState {

  theme: ThemeMode
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  loading: LoadingState
  toasts: Toast[]
  modals: Modal[]
  drawer: DrawerConfig
  mobileMenuOpen: boolean
  searchOpen: boolean
  searchQuery: string
  filtersOpen: boolean
  filtersApplied: number
  currentPage: string
  previousPage: string | null
  scrollPosition: Record<string, number>
  globalError: string | null
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  sidebarCollapsed: false,
  loading: {
    global: false,
    page: false,
    actions: {}
  },
  toasts: [],
  modals: [],
  drawer: {
    isOpen: false,
    size: 'md',
    position: 'right'
  },
  mobileMenuOpen: false,
  searchOpen: false,
  searchQuery: '',
  filtersOpen: false,
  filtersApplied: 0,
  currentPage: '',
  previousPage: null,
  scrollPosition: {},
  globalError: null
}

const generateId = () => Math.random().toString(36).substring(2, 11)


const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload
      
      if (typeof document !== 'undefined') {
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (action.payload === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (isDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }
    },
    toggleTheme: (state) => {
      const themes: ThemeMode[] = ['light', 'dark', 'system']
      const currentIndex = themes.indexOf(state.theme)
      const nextIndex = (currentIndex + 1) % themes.length
      state.theme = themes[nextIndex]

      
      if (typeof document !== 'undefined') {
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (state.theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (isDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }
    },

    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },

    
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.page = action.payload
    },
    setActionLoading: (state, action: PayloadAction<{ action: string; isLoading: boolean }>) => {
      if (action.payload.isLoading) {
        state.loading.actions[action.payload.action] = true
      } else {
        delete state.loading.actions[action.payload.action]
      }
    },
    clearAllLoading: (state) => {
      state.loading.global = false
      state.loading.page = false
      state.loading.actions = {}
    },

   
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = generateId()
      state.toasts.push({ ...action.payload, id })
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload)
    },
    clearToasts: (state) => {
      state.toasts = []
    },

  
    showModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const id = generateId()
      state.modals.push({ ...action.payload, id })
    },
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload)
    },
    hideTopModal: (state) => {
      state.modals.pop()
    },
    clearModals: (state) => {
      state.modals = []
    },

    openDrawer: (state, action: PayloadAction<Partial<DrawerConfig>>) => {
      state.drawer = {
        ...state.drawer,
        ...action.payload,
        isOpen: true
      }
    },
    closeDrawer: (state) => {
      state.drawer.isOpen = false
    },
    setDrawerContent: (state, action: PayloadAction<{ content?: React.ReactNode; title?: string }>) => {
      if (action.payload.content !== undefined) {
        state.drawer.content = action.payload.content
      }
      if (action.payload.title !== undefined) {
        state.drawer.title = action.payload.title
      }
    },

    openMobileMenu: (state) => {
      state.mobileMenuOpen = true
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },

    openSearch: (state) => {
      state.searchOpen = true
    },
    closeSearch: (state) => {
      state.searchOpen = false
      state.searchQuery = ''
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    clearSearchQuery: (state) => {
      state.searchQuery = ''
    },

    openFilters: (state) => {
      state.filtersOpen = true
    },
    closeFilters: (state) => {
      state.filtersOpen = false
    },
    toggleFilters: (state) => {
      state.filtersOpen = !state.filtersOpen
    },
    setFiltersApplied: (state, action: PayloadAction<number>) => {
      state.filtersApplied = action.payload
    },
    incrementFiltersApplied: (state) => {
      state.filtersApplied += 1
    },
    decrementFiltersApplied: (state) => {
      state.filtersApplied = Math.max(0, state.filtersApplied - 1)
    },
    resetFiltersApplied: (state) => {
      state.filtersApplied = 0
    },

    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.previousPage = state.currentPage
      state.currentPage = action.payload
    },
    setPreviousPage: (state, action: PayloadAction<string | null>) => {
      state.previousPage = action.payload
    },

    
    saveScrollPosition: (state, action: PayloadAction<{ path: string; position: number }>) => {
      state.scrollPosition[action.payload.path] = action.payload.position
    },
    getScrollPosition: () => {
      
    },
    clearScrollPosition: (state, action: PayloadAction<string>) => {
      delete state.scrollPosition[action.payload]
    },
    clearAllScrollPositions: (state) => {
      state.scrollPosition = {}
    },

  
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload
    },
    clearGlobalError: (state) => {
      state.globalError = null
    },

    
    resetUI: () => initialState
  }
})

export const {
  
  setTheme,
  toggleTheme,

  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setGlobalLoading,
  setPageLoading,
  setActionLoading,
  clearAllLoading,
  addToast,
  removeToast,
  clearToasts,
  showModal,
  hideModal,
  hideTopModal,
  clearModals,
  openDrawer,
  closeDrawer,
  setDrawerContent,
  openMobileMenu,
  closeMobileMenu,
  toggleMobileMenu,
  openSearch,
  closeSearch,
  toggleSearch,
  setSearchQuery,
  clearSearchQuery,
  openFilters,
  closeFilters,
  toggleFilters,
  setFiltersApplied,
  incrementFiltersApplied,
  decrementFiltersApplied,
  resetFiltersApplied,
  setCurrentPage,
  setPreviousPage,
  saveScrollPosition,
  clearScrollPosition,
  clearAllScrollPositions,
  setGlobalError,
  clearGlobalError,
  resetUI
} = uiSlice.actions

export default uiSlice.reducer