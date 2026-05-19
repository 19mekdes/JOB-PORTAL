/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { logout } from "../../redux/slices/authSlice";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Briefcase,
  Menu,
  Home,
  Search,
  Info,
  Phone,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Shield,
  Crown,
  Bookmark,
  Briefcase as BriefcaseIcon,
  FileText
} from "lucide-react";

// Import the NotificationBell component
import NotificationBell from "@/components/notifications/NotificationBell";

// Removed Separator import since it's not in your shadcn setup
// If you have it, add: import { Separator } from "@/components/ui/separator";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state: RootState) => state.auth);

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout() as any);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Jobs", path: "/jobs", icon: Search },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Phone },
  ];

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    switch (user.user_type) {
      case "Super Admin":
        return "/super-admin/dashboard";
      case "Admin":
        return "/admin/dashboard";
      case "Employer":
        return "/employer/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Get role icon
  const getRoleIcon = () => {
    if (!user) return null;
    switch (user.user_type) {
      case "Super Admin":
        return <Crown className="h-3 w-3 mr-1" />;
      case "Admin":
        return <Shield className="h-3 w-3 mr-1" />;
      case "Employer":
        return <BriefcaseIcon className="h-3 w-3 mr-1" />;
      default:
        return <User className="h-3 w-3 mr-1" />;
    }
  };

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-slate-900"
          >
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <span>JobPortal</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <Link key={item.name} to={item.path}>
                <Button
                  variant="ghost"
                  className="text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Dashboard Link based on role */}
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    {getUserInitial()}
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-sm font-medium text-slate-700">
                      {user?.full_name || user?.email?.split("@")[0]}
                    </span>
                    <div className="flex items-center text-xs text-slate-500">
                      {getRoleIcon()}
                      <span>{user?.user_type}</span>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-slate-700 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>

                <Link to="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-72 p-0">
                {/* Mobile Header */}
                <div className="border-b p-5">
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <div className="p-2 rounded-xl bg-blue-600 text-white">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    JobPortal
                  </div>

                  {user && (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                        {getUserInitial()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user?.full_name || user?.email?.split("@")[0]}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          {getRoleIcon()}
                          <span>{user?.user_type}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Nav */}
                <div className="p-4 space-y-2">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  {user && (
                    <>
                      <div className="border-t my-2"></div>
                      <Link to={getDashboardLink()} onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      
                      {user.user_type === 'Job Seeker' && (
                        <>
                          <Link to="/bookmarks" onClick={() => setOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-3">
                              <Bookmark className="h-4 w-4" />
                              Saved Jobs
                            </Button>
                          </Link>
                          <Link to="/applications" onClick={() => setOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-3">
                              <FileText className="h-4 w-4" />
                              Applications
                            </Button>
                          </Link>
                        </>
                      )}
                      
                      {user.user_type === 'Employer' && (
                        <Link to="/employer/post-job" onClick={() => setOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <BriefcaseIcon className="h-4 w-4" />
                            Post a Job
                          </Button>
                        </Link>
                      )}
                      
                      {(user.user_type === 'Admin' || user.user_type === 'Super Admin') && (
                        <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      
                      {user.user_type === 'Super Admin' && (
                        <Link to="/super-admin/dashboard" onClick={() => setOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <Crown className="h-4 w-4" />
                            Super Admin
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>

                {/* Mobile Auth */}
                <div className="border-t p-4 space-y-2">
                  {user ? (
                    <>
                      <Link to="/profile" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <User className="h-4 w-4" />
                          Profile
                        </Button>
                      </Link>

                      <Link to="/settings" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="w-full justify-start gap-3 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>

                      <Link to="/register" onClick={() => setOpen(false)}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Register
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;