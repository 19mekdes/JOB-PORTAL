import { useState } from 'react'
import {
  Bell,
  Moon,
  Sun,
  User,
  Building2,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type ActiveTab =
  | 'profile'
  | 'company'
  | 'security'
  | 'notifications'

const Settings = () => {
  const navigate = useNavigate()

  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] =
    useState<ActiveTab>('security')

  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    position: 'HR Manager',
  })

  const [companyData, setCompanyData] = useState({
    companyName: 'Tech Corp Inc.',
    industry: 'Technology',
    location: 'San Francisco, CA',
    website: 'https://techcorp.com',
    companySize: '50-100 employees',
  })

  const [emailNotifications, setEmailNotifications] =
    useState(true)

  const [applicationAlerts, setApplicationAlerts] =
    useState(true)

  const [marketingEmails, setMarketingEmails] =
    useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false)

  const [showNewPassword, setShowNewPassword] =
    useState(false)

  const [passwordMessage, setPasswordMessage] =
    useState<{
      type: 'success' | 'error'
      text: string
    } | null>(null)

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCompanyChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setCompanyData({
      ...companyData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleUpdatePassword = (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setPasswordMessage({
        type: 'error',
        text: 'Passwords do not match',
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      })
      return
    }

    setPasswordMessage({
      type: 'success',
      text: 'Password updated successfully!',
    })

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    setTimeout(() => {
      setPasswordMessage(null)
    }, 3000)
  }

  const sidebarItems = [
    {
      id: 'profile' as const,
      label: 'Profile Settings',
      icon: User,
    },
    {
      id: 'company' as const,
      label: 'Company Information',
      icon: Building2,
    },
    {
      id: 'security' as const,
      label: 'Security',
      icon: Shield,
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: Bell,
    },
  ]

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'bg-gray-900 text-white'
          : 'bg-gray-50 text-black'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() =>
            navigate('/employer/dashboard')
          }
          className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Settings
          </h1>
          <p className="text-sm text-gray-500">
            Manage your account settings and
            preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div
            className={`rounded-2xl border p-4 ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      setActiveTab(item.id)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div
            className={`rounded-2xl border p-6 lg:col-span-3 ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Profile Settings
                </h2>

                <input
                  type="text"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none"
                />

                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none"
                />

                <button className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
                  Save Profile
                </button>
              </div>
            )}

            {/* COMPANY */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Company Information
                </h2>

                <input
                  type="text"
                  name="companyName"
                  value={companyData.companyName}
                  onChange={handleCompanyChange}
                  placeholder="Company Name"
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none"
                />

                <input
                  type="text"
                  name="location"
                  value={companyData.location}
                  onChange={handleCompanyChange}
                  placeholder="Location"
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none"
                />

                <button className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
                  Save Company Info
                </button>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">
                  Security
                </h2>

                {/* Dark Mode */}
                <div className="flex items-center justify-between rounded-xl border border-gray-300 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {darkMode ? (
                        <Moon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Sun className="h-4 w-4 text-blue-600" />
                      )}

                      <h3 className="font-medium">
                        Dark Mode
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500">
                      Toggle between dark and
                      light themes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDarkMode(!darkMode)
                    }
                    className={`relative h-6 w-12 rounded-full transition-all duration-300 ${
                      darkMode
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                        darkMode
                          ? 'left-7'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Password */}
                <form
                  onSubmit={handleUpdatePassword}
                  className="space-y-4"
                >
                  {passwordMessage && (
                    <div
                      className={`rounded-xl p-3 text-sm ${
                        passwordMessage.type ===
                        'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type={
                        showCurrentPassword
                          ? 'text'
                          : 'password'
                      }
                      name="currentPassword"
                      value={
                        passwordData.currentPassword
                      }
                      onChange={handlePasswordChange}
                      placeholder="Current Password"
                      className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 pr-10 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          !showCurrentPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      name="newPassword"
                      value={
                        passwordData.newPassword
                      }
                      onChange={handlePasswordChange}
                      placeholder="New Password"
                      className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 pr-10 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          !showNewPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <input
                    type="password"
                    name="confirmPassword"
                    value={
                      passwordData.confirmPassword
                    }
                    onChange={handlePasswordChange}
                    placeholder="Confirm Password"
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold">
                  Notification Preferences
                </h2>

                {/* Email Notifications */}
                <div className="flex items-center justify-between rounded-xl border border-gray-300 p-4">
                  <div>
                    <h3 className="font-medium">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive updates via email.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEmailNotifications(
                        !emailNotifications
                      )
                    }
                    className={`relative h-6 w-12 rounded-full transition-all duration-300 ${
                      emailNotifications
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                        emailNotifications
                          ? 'left-7'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Application Alerts */}
                <div className="flex items-center justify-between rounded-xl border border-gray-300 p-4">
                  <div>
                    <h3 className="font-medium">
                      Application Alerts
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get notified for new
                      applications.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setApplicationAlerts(
                        !applicationAlerts
                      )
                    }
                    className={`relative h-6 w-12 rounded-full transition-all duration-300 ${
                      applicationAlerts
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                        applicationAlerts
                          ? 'left-7'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between rounded-xl border border-gray-300 p-4">
                  <div>
                    <h3 className="font-medium">
                      Marketing Emails
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive promotional offers
                      and updates.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMarketingEmails(
                        !marketingEmails
                      )
                    }
                    className={`relative h-6 w-12 rounded-full transition-all duration-300 ${
                      marketingEmails
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                        marketingEmails
                          ? 'left-7'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings