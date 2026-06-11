import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  user_type: "Job Seeker" | "Employer";
  phone: string;
  location: string;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasSpecialChar: boolean;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    user_type: "Job Seeker",
    phone: "",
    location: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, isError, message } = useSelector(
    (state: RootState) => state.auth
  );

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    return {
      hasMinLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordStrength = checkPasswordStrength(formData.password);
  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
  const doPasswordsMatch = formData.password === formData.confirmPassword;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isFormValid =
    isEmailValid &&
    isPasswordStrong &&
    doPasswordsMatch &&
    formData.full_name.trim().length >= 2 &&
    (formData.user_type === "Job Seeker" || formData.user_type === "Employer");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBlur = (fieldName: string) => {
    setTouched({
      ...touched,
      [fieldName]: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = formData;
    
    try {
      const result = await dispatch(register(registerData)).unwrap();
      console.log("Registration result:", result);
      
      
      setRegistrationSuccess(true);
      
      // ✅ Redirect to login page after 1 second
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  // Password strength indicator color
  const getPasswordStrengthColor = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength <= 2) return "bg-red-500";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength <= 2) return "Weak";
    if (strength <= 4) return "Medium";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join JobPortal to start your career journey
          </p>
        </div>

        {/* Success Alert */}
        {registrationSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Account created successfully! Redirecting to login page...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {isError && !registrationSuccess && (
          <Alert variant="destructive">
            <AlertDescription>
              {message || "Registration failed. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        {/* Form - Disable when registration is successful */}
        {!registrationSuccess ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-white shadow-md rounded-lg p-6 space-y-5">
              {/* Full Name */}
              <div>
                <Label htmlFor="full_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("full_name")}
                  placeholder="John Doe"
                  className="mt-1"
                  disabled={isLoading}
                />
                {touched.full_name && !formData.full_name.trim() && (
                  <p className="text-red-500 text-xs mt-1">
                    Full name is required
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">
                  Email address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  className="mt-1"
                  disabled={isLoading}
                />
                {touched.email && !isEmailValid && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              {/* User Type */}
              <div>
                <Label htmlFor="user_type">
                  I am a <span className="text-red-500">*</span>
                </Label>
                <select
                  id="user_type"
                  name="user_type"
                  required
                  value={formData.user_type}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="Job Seeker">Job Seeker</option>
                  <option value="Employer">Employer</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      handleBlur("password");
                    }}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (passwordFocused || touched.password) && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{
                            width: `${
                              (Object.values(passwordStrength).filter(Boolean)
                                .length /
                                5) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="ml-2 text-xs font-medium">
                        {getPasswordStrengthText()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        {passwordStrength.hasMinLength ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span>Min 8 characters</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {passwordStrength.hasNumber ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span>Has number</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {passwordStrength.hasUpperCase ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span>Uppercase letter</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {passwordStrength.hasLowerCase ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span>Lowercase letter</span>
                      </div>
                      <div className="flex items-center space-x-1 col-span-2">
                        {passwordStrength.hasSpecialChar ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span>Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur("confirmPassword")}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {touched.confirmPassword &&
                  formData.confirmPassword &&
                  !doPasswordsMatch && (
                    <p className="text-red-500 text-xs mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Terms and Conditions */}
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </p>
          </form>
        ) : (
          // Show loading state while redirecting
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Redirecting to login page...</p>
          </div>
        )}

        {/* Sign in link - Hide when registration is successful */}
        {!registrationSuccess && (
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;