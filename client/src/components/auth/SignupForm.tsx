'use client';

// ============================================
// Signup Form Component - Dark Luxury Theme
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { signupSchema, SignupFormData } from '@/lib/validations';
import Alert from '@/components/ui/Alert';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupForm() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    clearError();

    try {
      await signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      setSuccess(true);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch {
      // Error is handled by the store
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="w-full flex justify-center animate-fade-in relative z-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-softwhite/50 font-light text-[15px] tracking-wide">
            Join UNSAID for private emotional wellness
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-6 bg-red-900/20 border border-red-500/30 text-red-200">
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert variant="success" className="mb-6 bg-green-900/20 border border-green-500/30 text-green-200">
            Account created successfully. Accessing secure connection...
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full relative group">
                <label htmlFor="firstName" className="block text-xs font-semibold text-softwhite/60 mb-2 uppercase tracking-widest pl-1">
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    {...register('firstName')}
                    disabled={isFormLoading || success}
                    className="w-full h-12 bg-midnight/40 backdrop-blur-md rounded-[14px] px-4 py-3 text-[15px] text-white
                                border border-white/5 transition-all duration-300 ease-in-out
                                focus:outline-none focus:border-electric/50 focus:bg-midnight/60
                                focus:shadow-[0_4px_20px_rgba(59,130,246,0.15)]
                                placeholder:text-softwhite/20 placeholder:font-light
                                disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {errors.firstName?.message && (
                  <p className="mt-1.5 text-xs text-red-400 pl-1 font-light">{errors.firstName.message}</p>
                )}
              </div>
              <div className="w-full relative group">
                <label htmlFor="lastName" className="block text-xs font-semibold text-softwhite/60 mb-2 uppercase tracking-widest pl-1">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    {...register('lastName')}
                    disabled={isFormLoading || success}
                    className="w-full h-12 bg-midnight/40 backdrop-blur-md rounded-[14px] px-4 py-3 text-[15px] text-white
                                border border-white/5 transition-all duration-300 ease-in-out
                                focus:outline-none focus:border-electric/50 focus:bg-midnight/60
                                focus:shadow-[0_4px_20px_rgba(59,130,246,0.15)]
                                placeholder:text-softwhite/20 placeholder:font-light
                                disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {errors.lastName?.message && (
                  <p className="mt-1.5 text-xs text-red-400 pl-1 font-light">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="w-full relative group">
              <label htmlFor="email" className="block text-xs font-semibold text-softwhite/60 mb-2 uppercase tracking-widest pl-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  {...register('email')}
                  disabled={isFormLoading || success}
                  className="w-full h-14 bg-midnight/40 backdrop-blur-md rounded-[14px] px-5 py-3 text-[15px] text-white
                              border border-white/5 transition-all duration-300 ease-in-out
                              focus:outline-none focus:border-electric/50 focus:bg-midnight/60
                              focus:shadow-[0_4px_20px_rgba(59,130,246,0.15)]
                              placeholder:text-softwhite/20 placeholder:font-light
                              disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {errors.email?.message && (
                <p className="mt-1.5 text-xs text-red-400 pl-1 font-light">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="w-full relative group">
              <label htmlFor="password" className="block text-xs font-semibold text-softwhite/60 mb-2 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  {...register('password')}
                  disabled={isFormLoading || success}
                  className="w-full h-14 bg-midnight/40 backdrop-blur-md rounded-[14px] px-5 py-3 pr-12 text-[15px] text-white
                              border border-white/5 transition-all duration-300 ease-in-out
                              focus:outline-none focus:border-electric/50 focus:bg-midnight/60
                              focus:shadow-[0_4px_20px_rgba(59,130,246,0.15)]
                              placeholder:text-softwhite/20 placeholder:font-light
                              disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-softwhite/40 hover:text-softwhite/80 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 stroke-[1.5px]" />
                  ) : (
                    <Eye className="h-5 w-5 stroke-[1.5px]" />
                  )}
                </button>
              </div>
              {errors.password?.message ? (
                <p className="mt-1.5 text-xs text-red-400 pl-1 font-light">{errors.password.message}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-softwhite/40 pl-1 font-light">
                  Must contain: 8+ characters, uppercase, lowercase, number, special character
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="w-full relative group">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-softwhite/60 mb-2 uppercase tracking-widest pl-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  disabled={isFormLoading || success}
                  className="w-full h-14 bg-midnight/40 backdrop-blur-md rounded-[14px] px-5 py-3 pr-12 text-[15px] text-white
                              border border-white/5 transition-all duration-300 ease-in-out
                              focus:outline-none focus:border-electric/50 focus:bg-midnight/60
                              focus:shadow-[0_4px_20px_rgba(59,130,246,0.15)]
                              placeholder:text-softwhite/20 placeholder:font-light
                              disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-softwhite/40 hover:text-softwhite/80 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 stroke-[1.5px]" />
                  ) : (
                    <Eye className="h-5 w-5 stroke-[1.5px]" />
                  )}
                </button>
              </div>
              {errors.confirmPassword?.message && (
                <p className="mt-1.5 text-xs text-red-400 pl-1 font-light">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isFormLoading || success}
              className="w-full h-14 bg-gradient-to-r from-electric to-lavenderglow text-white rounded-[30px] font-medium text-[15px] tracking-wide
                         transition-all duration-300 ease-out shadow-glow-electric relative group overflow-hidden
                         hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-glow-electric"
            >
              {/* Inner Soft Highlight */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[30px] pointer-events-none"></div>

              <span className="relative z-10 flex items-center justify-center gap-2">
                {isFormLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </span>
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-px bg-white/10"></div>
          <p className="text-[13px] text-softwhite/50 tracking-wide">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-electric/90 hover:text-electric transition-colors hover:underline underline-offset-4 decoration-electric/50 ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
