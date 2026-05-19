// src/pages/superadmin/SuperAdminLayout.tsx
import React, { useState } from 'react'
import { 
  LayoutDashboard, Users, Shield, FileText, Settings, Activity, Database,
  ChevronLeft, ChevronRight, LogOut, UserCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Import all super admin components
import SuperAdminDashboard from './Dashboard'
import AdminsManagement from './AdminsManagement'
import AuditLogs from './AuditLogs'
import BackupRestore from './BackupRestore'
import SystemHealth from './SystemHealth'
import SettingsPage from './Settings'

interface NavItem {
  id: string
  title: string
  icon: React.ElementType
  component: React.ReactNode
}

const SuperAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const navItems: NavItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, component: <SuperAdminDashboard /> },
    { id: 'admins', title: 'Admin Management', icon: Users, component: <AdminsManagement /> },
    { id: 'audit', title: 'Audit Logs', icon: FileText, component: <AuditLogs /> },
    { id: 'backup', title: 'Backup & Restore', icon: Database, component: <BackupRestore /> },
    { id: 'health', title: 'System Health', icon: Activity, component: <SystemHealth /> },
    { id: 'settings', title: 'Settings', icon: Settings, component: <SettingsPage /> }
  ]

  const getCurrentComponent = () => {
    const currentItem = navItems.find(item => item.id === activeTab)
    return currentItem ? currentItem.component : <SuperAdminDashboard />
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - White */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-gray-700" />
              <span className="font-bold text-lg text-gray-800">Super Admin</span>
            </div>
          ) : (
            <Shield className="h-6 w-6 text-gray-700 mx-auto" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Menu - White background */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                  {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">{item.title}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-100 text-gray-600">SA</AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">Super Admin</p>
                    <p className="text-xs text-gray-500">admin@jobportal.com</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-700">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-gray-600">
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area - White background */}
      <main className="flex-1 overflow-auto bg-white">
        {/* Top Header - White */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {navItems.find(item => item.id === activeTab)?.title}
              </h2>
              <p className="text-sm text-gray-500">
                Super Admin Panel • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Page Content - White background */}
        <div className="p-6 bg-white">
          {getCurrentComponent()}
        </div>
      </main>
    </div>
  )
}

export default SuperAdminLayout