import React, { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

interface MainLayoutProps {
  children?: ReactNode
  showFooter?: boolean
  showNavbar?: boolean
  className?: string
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showFooter = true, 
  showNavbar = true,
  className = ''
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showNavbar && <Navbar />}
      
      <main className={`grow ${className}`}>
        {children || <Outlet />}
      </main>
      
      {showFooter && <Footer />}
    </div>
  )
}

export default MainLayout