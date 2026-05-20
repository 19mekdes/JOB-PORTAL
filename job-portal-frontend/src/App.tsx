// App.tsx - Full Corrected Code
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store'

// Layouts
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import JobSeekerLayout from '@/pages/JobSeekerLayout'
import EmployerLayout from '@/pages/employer/EmployerLayout'

// Public Pages
import Home from '@/pages/Home'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Unauthorized from '@/pages/Unauthorized'
import NotFound from '@/pages/NotFound'

// Auth Pages
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import ForgotPassword from '@/components/auth/ForgotPassword'
import ResetPassword from '@/components/auth/ResetPassword'

// Job Seeker Pages (Public - No login required for viewing)
import JobsPage from '@/pages/JobsPage'
import JobDetailsPage from '@/pages/JobDetailsPage'

// Job Seeker Pages (Protected - Login required)
import DashboardContent from '@/pages/DashboardContent'
import ApplyPage from '@/pages/ApplyPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import ApplicationStatusPage from '@/pages/ApplicationStatusPage'
import BookmarksPage from '@/pages/BookmarksPage'
import SeekerProfile from '@/pages/jobseeker/SeekerProfile'

// Employer Pages
import EmployerDashboardContent from '@/pages/employer/DashboardContent'
import EmployerJobs from '@/pages/employer/EmployerJobs'
import EmployerApplications from '@/pages/employer/EmployerApplications'
import Analytics from '@/pages/employer/Analytics'
import CompanyProfile from '@/pages/employer/CompanyProfile'
import EmployerSettings from '@/pages/employer/Settings'
import EditJob from '@/pages/employer/EditJob'
import ApplicationDetails from '@/components/employer/ApplicationDetails'
import PostJobPage from './pages/PostJobPage'

// Notification Pages
import NotificationList from '@/components/notifications/NotificationList'
import NotificationPreferences from '@/components/notifications/NotificationPreferences'

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminJobs from '@/pages/admin/Jobs'
import AdminApplications from '@/pages/admin/Applications'
import AdminAnalytics from '@/pages/admin/Analytics'
import AdminSettings from '@/pages/admin/Settings'
import AdminLayout from './pages/admin/AdminLayout'

// Super Admin
import SuperAdminLayout from '@/pages/superadmin/SuperAdminLayout'

// Route Guards
import PrivateRoute, {
  JobSeekerRoute,
  EmployerRoute,
  AdminRoute,
  SuperAdminRoute
} from '@/components/common/PrivateRoute'
import JobSeekerPreferences from './pages/jobseeker/Preferences'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>

          {/* ========== PUBLIC ROUTES (MainLayout - No Sidebar) ========== */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* ========== PUBLIC JOB ROUTES (No Login Required - MainLayout) ========== */}
          {/* These are for non-logged-in users to browse jobs */}
          <Route element={<MainLayout />}>
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
          </Route>

          {/* ========== AUTH ROUTES ========== */}
          <Route path="/login" element={
            <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
              <Login />
            </AuthLayout>
          } />

          <Route path="/register" element={
            <AuthLayout title="Create Account" subtitle="Join thousands of job seekers and employers">
              <Register />
            </AuthLayout>
          } />

          <Route path="/forgot-password" element={
            <AuthLayout title="Reset Password" subtitle="We'll send you a link to reset your password">
              <ForgotPassword />
            </AuthLayout>
          } />

          <Route path="/reset-password/:token" element={
            <AuthLayout title="Create New Password" subtitle="Enter your new password below">
              <ResetPassword />
            </AuthLayout>
          } />

          {/* ========== PROTECTED ROUTES (All Authenticated Users) ========== */}
          <Route element={<PrivateRoute />}>
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/notifications/settings" element={<NotificationPreferences />} />
          </Route>

          {/* ========== JOB SEEKER ONLY ROUTES (WITH SIDEBAR - Requires Login) ========== */}
          {/* Note: /jobs and /jobs/:id are NOT here because they are public */}
          <Route element={<JobSeekerRoute />}>
            <Route element={<JobSeekerLayout />}>
              <Route path="/dashboard" element={<DashboardContent />} />
              <Route path="/apply/:jobId" element={<ApplyPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/:id" element={<ApplicationStatusPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/saved-jobs" element={<BookmarksPage />} />
              <Route path="/jobseeker/preferences" element={<JobSeekerPreferences />} />
              <Route path="/profile" element={<SeekerProfile />} />
            </Route>
          </Route>

          {/* ========== EMPLOYER ONLY ROUTES (WITH SIDEBAR) ========== */}
          <Route element={<EmployerRoute />}>
            <Route element={<EmployerLayout />}>
              <Route path="/employer/dashboard" element={<EmployerDashboardContent />} />
              <Route path="/employer/jobs" element={<EmployerJobs />} />
              <Route path="/employer/applications" element={<EmployerApplications />} />
              <Route path="/employer/post-job" element={<PostJobPage />} />
              <Route path="/employer/analytics" element={<Analytics />} />
              <Route path="/employer/profile" element={<CompanyProfile />} />
              <Route path="/employer/settings" element={<EmployerSettings />} />
              <Route path="/employer/jobs/:id/edit" element={<EditJob />} />
              <Route path="/employer/applications/:id" element={<ApplicationDetails />} />
            </Route>
          </Route>

          {/* ========== ADMIN ROUTES ========== */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/jobs" element={<AdminJobs />} />
              <Route path="/admin/applications" element={<AdminApplications />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ========== SUPER ADMIN ONLY ROUTES ========== */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/super-admin/*" element={<SuperAdminLayout />} />
          </Route>

          {/* ========== 404 NOT FOUND ========== */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App