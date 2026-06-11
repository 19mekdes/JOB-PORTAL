import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'

// Layout Components
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// Public Pages
import Home from '@/pages/Home'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import JobsPage from '@/pages/JobsPage'
import JobDetailsPage from '@/pages/JobDetailsPage'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import ForgotPassword from '@/components/auth/ForgotPassword'
import ResetPassword from '@/components/auth/ResetPassword'
import VerifyEmail from '@/components/auth/VerifyEmail'
import NotFound from '@/pages/NotFound'
import Unauthorized from '@/pages/Unauthorized'

// Protected Pages - Job Seeker
import Dashboard from '@/pages/DashboardContent'
import ProfilePage from '@/pages/ProfilePage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import ApplicationStatus from '@/components/applications/ApplicationStatus'
import BookmarksPage from '@/pages/BookmarksPage'
import ApplicationForm from '@/components/applications/ApplicationForm'

// Protected Pages - Employer
import ManageJobsPage from '@/pages/ManageJobsPage'
import PostJobPage from '@/pages/PostJobPage'
import JobApplicationsList from '@/components/employer/JobApplicationsList'
import ApplicationDetails from '@/components/employer/ApplicationDetails'
import CompanyProfile from '@/components/employer/CompanyProfile'
import EmployerDashboard from '@/components/employer/DashboardStats'

// Protected Pages - Admin
import AdminPage from '@/pages/AdminPage'
import AdminDashboard from '@/components/admin/AdminDashboard'
import UserManagement from '@/components/admin/UserManagement'
import JobModeration from '@/components/admin/JobModeration'
import IndustryManagement from '@/components/admin/IndustryManagement'
import Reports from '@/components/admin/Reports'
import SystemSettings from '@/components/admin/SystemSettings'

// Protected Pages - Super Admin
import SuperAdminPage from '@/pages/SuperAdminPage'
import SuperAdminDashboard from '@/components/superadmin/SuperAdminDashboard'
import AdminManagement from '@/components/superadmin/AdminManagement'
import AuditLogs from '@/components/superadmin/AuditLogs'
import BackupRestore from '@/components/superadmin/BackupRestore'
import SystemHealth from '@/components/superadmin/SystemHealth'

// Notification Pages
import NotificationList from '@/components/notifications/NotificationList'
import NotificationPreferences from '@/components/notifications/NotificationPreferences'

// Private Route Components
import PrivateRoute from '@/components/common/PrivateRoute'
import { JobSeekerRoute, EmployerRoute, AdminRoute, SuperAdminRoute } from '@/components/common/PrivateRoute'

const AppRoutes: React.FC = () => {
  useSelector((state: RootState) => state.auth)

  return (
    <Routes>
      {/* Public Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Auth Routes with AuthLayout */}
      <Route element={<AuthLayout title="Welcome Back" subtitle="Sign in to your account">Login</AuthLayout>}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<AuthLayout title="Create Account" subtitle="Join JobPortal today">Register</AuthLayout>}>
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Protected Routes - General */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationList />} />
        <Route path="/notifications/settings" element={<NotificationPreferences />} />
      </Route>

      {/* Job Seeker Routes */}
      <Route element={<JobSeekerRoute><MainLayout /></JobSeekerRoute>}>
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:id/status" element={<ApplicationStatus />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/apply/:jobId" element={<ApplicationForm />} />
      </Route>

      {/* Employer Routes */}
      <Route element={<EmployerRoute><MainLayout /></EmployerRoute>}>
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/jobs" element={<ManageJobsPage />} />
        <Route path="/employer/post-job" element={<PostJobPage />} />
        <Route path="/employer/jobs/:id/edit" element={<PostJobPage />} />
        <Route path="/employer/jobs/:jobId/applications" element={<JobApplicationsList />} />
        <Route path="/employer/applications/:id" element={<ApplicationDetails />} />
        <Route path="/employer/profile" element={<CompanyProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute><AdminPage /></AdminRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="jobs" element={<JobModeration />} />
        <Route path="industries" element={<IndustryManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* Super Admin Routes */}
      <Route element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>}>
        <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="backup" element={<BackupRestore />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes