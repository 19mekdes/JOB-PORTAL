import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
<footer className="bg-white text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div>
            <h3 className="text-xl font-bold text-white mb-4">JobPortal</h3>
            <p className="text-gray-400">Find your dream job today!</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/jobs" className="text-gray-400 hover:text-white">Jobs</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Job Seekers</h3>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-gray-400 hover:text-white">Register</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
              <li><Link to="/applications" className="text-gray-400 hover:text-white">Applications</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Employers</h3>
            <ul className="space-y-2">
              <li><Link to="/employer/post-job" className="text-gray-400 hover:text-white">Post a Job</Link></li>
              <li><Link to="/employer/jobs" className="text-gray-400 hover:text-white">Manage Jobs</Link></li>
            </ul>
          </div>
        </div>
        
        <div className=" mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} JobPortal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer