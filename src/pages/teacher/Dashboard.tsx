import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { BookOpen, Layers, Loader2, Users, ClipboardList, Video, FileText, TrendingUp, ArrowUpRight } from 'lucide-react'

export default function TeacherDashboard({ user }: { user: any }) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['teacher-stats', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/stats/teacher/${user.id}`)
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    const { data: dashboard } = useQuery({
        queryKey: ['teacher-dashboard', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/teacher/${user.id}`)
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    if (isLoading) return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>

    const cards = [
        { title: 'My Subjects', value: dashboard?.subjects || stats?.subjects || 0, icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-600' },
        { title: 'My Classes', value: dashboard?.classes || stats?.classes || 0, icon: Layers, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
        { title: 'Assignments', value: dashboard?.assignments || 0, icon: ClipboardList, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-600' },
        { title: 'Live Classes', value: dashboard?.liveClasses || 0, icon: Video, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-600' },
    ]

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
    const greeting = timeOfDay === 'morning' ? '🌅 Good morning' : timeOfDay === 'afternoon' ? '☀️ Good afternoon' : '🌙 Good evening'

    return (
        <div className="p-4 lg:p-6 animate-fade-in text-slate-700">
            {/* Welcome Banner */}
            <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 gradient-animate rounded-2xl p-6 sm:p-8 mb-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjA1IiBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L3N2Zz4=')] opacity-50" />
                <div className="relative">
                    <p className="text-white/70 text-sm font-medium mb-1">{greeting},</p>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{user.name}</h1>
                    <p className="text-white/60 text-sm max-w-lg">Here's your teaching overview for today. Keep inspiring your students! 🚀</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <ArrowUpRight className={`w-4 h-4 ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{card.value}</h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">{card.title}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Subject Performance</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Average scores by subject</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                            <TrendingUp className="w-3.5 h-3.5" /> Analytics
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.performanceChart || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                                <Bar dataKey="averageScore" fill="url(#blueGradient)" name="Average Score (%)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Quiz Distribution</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Attempts across subjects</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats?.performanceChart || []} dataKey="attempts" nameKey="subject" cx="50%" cy="50%" outerRadius={95} innerRadius={55} strokeWidth={3} stroke="#fff" label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}>
                                    {(stats?.performanceChart || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        <h2 className="text-base font-bold text-slate-800">Recent Submissions</h2>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{(dashboard?.recentSubmissions || []).length} total</span>
                </div>
                {(dashboard?.recentSubmissions || []).length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No recent submissions</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(dashboard?.recentSubmissions || []).map((sub: any, i: number) => (
                            <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-slate-100/50 transition-all group" style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                        {sub.student?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{sub.student?.name}</p>
                                        <p className="text-xs text-slate-400">{sub.assignment?.title}</p>
                                    </div>
                                </div>
                                <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg font-medium">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
