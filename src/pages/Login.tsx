import { useState } from 'react'
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'

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
        <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-900/50 via-transparent to-purple-900/30" />
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-sky-500/8 rounded-full blur-[100px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 w-full max-w-[420px]">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary-500/20 p-2 overflow-hidden hover:scale-105 transition-transform duration-300">
                        <img src="/badge.png" alt="UBaS Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">UBaS LMS</h1>
                    <p className="text-white/40 font-medium text-sm">Learning Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">Welcome back</h2>
                        <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-white/40 text-sm mb-7">Sign in to continue your learning journey</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[13px] font-semibold text-white/60 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white 
                           placeholder:text-white/20 text-sm focus:outline-none focus:ring-2 
                           focus:ring-primary-400/40 focus:border-primary-400/30 focus:bg-white/[0.08] transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-white/60 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white 
                             placeholder:text-white/20 text-sm focus:outline-none focus:ring-2 
                             focus:ring-primary-400/40 focus:border-primary-400/30 focus:bg-white/[0.08] transition-all pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl text-sm
                         hover:from-primary-600 hover:to-primary-700 transition-all duration-300 flex items-center justify-center gap-2
                         disabled:opacity-60 active:scale-[0.98] shadow-xl shadow-primary-500/30 hover:shadow-primary-500/40"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-7 pt-6 border-t border-white/[0.06]">
                        <p className="text-[11px] text-white/25 text-center leading-relaxed">
                            Don't have an account? Please contact the IT Department or your School Administrator to request access credentials.
                        </p>
                    </div>
                </div>

                <p className="text-center text-white/15 text-[11px] mt-6">
                    © 2026 UBaS LMS • Powered by SchoolTech
                </p>
            </div>
        </div>
    )
}
