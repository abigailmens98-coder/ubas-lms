import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'

interface LoginProps {
    onLogin: (email: string, password: string) => void
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setTimeout(() => {
            onLogin(email, password)
            setIsLoading(false)
        }, 800)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-purple-700 
                    flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 
                          flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-2xl font-bold text-white">U</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">UBaS LMS</h1>
                    <p className="text-white/60 text-sm">Learning Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
                    <p className="text-white/50 text-sm mb-6">Sign in to your account</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white 
                           placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 
                           focus:ring-white/30 focus:border-white/20 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white 
                             placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 
                             focus:ring-white/30 focus:border-white/20 transition-all pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/10" />
                                <span className="text-sm text-white/60">Remember me</span>
                            </label>
                            <button type="button" className="text-sm text-white/60 hover:text-white transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-white text-primary-600 font-semibold rounded-xl text-sm
                         hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2
                         disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]
                         shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-5 border-t border-white/10">
                        <p className="text-xs text-white/40 text-center mb-3">Demo Accounts (click to fill)</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Admin', email: 'admin@ubas.edu' },
                                { label: 'Teacher', email: 'teacher@ubas.edu' },
                                { label: 'Student', email: 'student@ubas.edu' },
                            ].map((demo) => (
                                <button
                                    key={demo.label}
                                    type="button"
                                    onClick={() => { setEmail(demo.email); setPassword('password123') }}
                                    className="py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-medium 
                             text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
                                >
                                    {demo.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-white/30 text-xs mt-6">
                    © 2026 UBaS LMS. All rights reserved.
                </p>
            </div>
        </div>
    )
}
