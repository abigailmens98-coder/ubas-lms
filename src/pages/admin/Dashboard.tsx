import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Users, BookOpen, Layers, Loader2, ClipboardList, Bell, UserCheck, TrendingUp, Award, MessageSquare, FolderOpen, Trophy, ArrowUpRight, Sparkles } from 'lucide-react'

export default function AdminDashboard({ user }: { user: any }) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch(`/api/stats/admin/${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch admin stats')
            return res.json()
        }
    })

    const { data: dashboard } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/admin/${user.id}`)
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    const { data: analytics } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: async () => {
            const res = await fetch('/api/analytics/admin')
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    if (isLoading) return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>

    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
    const greeting = timeOfDay === 'morning' ? '🌅 Good morning' : timeOfDay === 'afternoon' ? '☀️ Good afternoon' : '🌙 Good evening'

    const mainCards = [
        { title: 'Students', value: analytics?.totalStudents || dashboard?.students || 0, icon: Users, gradient: 'from-blue-500 to-cyan-500', text: 'text-blue-600' },
        { title: 'Teachers', value: analytics?.totalTeachers || dashboard?.teachers || 0, icon: UserCheck, gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600' },
        { title: 'Classes', value: dashboard?.classes || stats?.classes || 0, icon: Layers, gradient: 'from-violet-500 to-purple-500', text: 'text-violet-600' },
        { title: 'Subjects', value: dashboard?.subjects || stats?.subjects || 0, icon: BookOpen, gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600' },
    ]

    const secondaryCards = [
        { title: 'Quizzes', value: analytics?.totalQuizzes || 0, icon: Trophy, gradient: 'from-rose-500 to-pink-500' },
        { title: 'Assignments', value: analytics?.totalAssignments || dashboard?.assignments || 0, icon: ClipboardList, gradient: 'from-sky-500 to-blue-500' },
        { title: 'Resources', value: analytics?.totalResources || 0, icon: FolderOpen, gradient: 'from-teal-500 to-emerald-500' },
        { title: 'Messages', value: analytics?.totalMessages || 0, icon: MessageSquare, gradient: 'from-indigo-500 to-violet-500' },
    ]

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

    return (
        <div className="p-4 lg:p-6 animate-fade-in text-slate-700">
            {/* Welcome Banner */}
            <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 sm:p-8 mb-8 text-white overflow-hidden gradient-animate">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjA1IiBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L3N2Zz4=')] opacity-50" />
                <div className="relative flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <p className="text-white/60 text-sm font-medium">{greeting},</p>
                </div>
                <h1 className="relative text-2xl sm:text-3xl font-bold tracking-tight">{user.name}</h1>
                <p className="relative text-white/40 text-sm mt-1">Here's your school administration overview</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {mainCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <ArrowUpRight className={`w-4 h-4 ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{card.value}</h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">{card.title}</p>
                    </div>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {secondaryCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100/80 p-4 flex items-center gap-3 hover:shadow-md transition-all group">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-800">{card.value}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Grade Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div><h2 className="text-base font-bold text-slate-800">Grade Distribution</h2><p className="text-xs text-slate-400 mt-0.5">Quiz scores across all students</p></div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold"><Award className="w-3.5 h-3.5" /> Grades</div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.gradeDistribution || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                                <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                                    {(analytics?.gradeDistribution || []).map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Class Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div><h2 className="text-base font-bold text-slate-800">Students per Class</h2><p className="text-xs text-slate-400 mt-0.5">Enrollment distribution</p></div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={analytics?.classDistribution || []} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} strokeWidth={3} stroke="#fff"
                                    label={(props: any) => `${props.name || ''}`}>
                                    {(analytics?.classDistribution || []).map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Enrollment Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div><h2 className="text-base font-bold text-slate-800">Enrollment Trend</h2><p className="text-xs text-slate-400 mt-0.5">New signups over the last 30 days</p></div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"><TrendingUp className="w-3.5 h-3.5" /> Trend</div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.enrollmentTrend || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorEnroll)" strokeWidth={2.5} name="Signups" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Teacher Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Teacher Activity</h2>
                    <p className="text-xs text-slate-400 mb-5">Content created per teacher</p>
                    <div className="space-y-3 max-h-[240px] overflow-y-auto">
                        {(analytics?.teacherActivity || []).length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-6">No teacher data yet</p>
                        ) : (
                            (analytics?.teacherActivity || []).map((t: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {t.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{t.name}</p>
                                        <p className="text-[10px] text-slate-400">{t.subjects} subjects • {t.quizzes} quizzes • {t.assignments} tasks</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Chart + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center gap-2 mb-6"><TrendingUp className="w-5 h-5 text-primary-500" /><h2 className="text-base font-bold text-slate-800">Subject Performance</h2></div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.performanceChart || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorScore2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                                <Area type="monotone" dataKey="averageScore" stroke="#8b5cf6" fill="url(#colorScore2)" strokeWidth={2.5} name="Average Score (%)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6">
                    <div className="flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-amber-500" /><h2 className="text-base font-bold text-slate-800">Recent Activity</h2></div>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                        {(dashboard?.recentActivity || []).length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
                        ) : (
                            (dashboard?.recentActivity || []).map((act: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold 
                                        ${act.type === 'assignment' ? 'bg-pink-100 text-pink-600' : act.type === 'announcement' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                                        {act.type === 'assignment' ? '📝' : act.type === 'announcement' ? '📢' : '🔔'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{act.title}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
