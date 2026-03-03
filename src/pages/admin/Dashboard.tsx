import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Users, BookOpen, Layers, Award, Loader2, ClipboardList, Bell, UserCheck, TrendingUp } from 'lucide-react'

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        )
    }

    const cards = [
        { title: 'Total Students', value: dashboard?.students || stats?.students || 0, icon: Users, gradient: 'from-blue-500 to-blue-600' },
        { title: 'Total Teachers', value: dashboard?.teachers || 0, icon: UserCheck, gradient: 'from-emerald-500 to-emerald-600' },
        { title: 'Total Classes', value: dashboard?.classes || stats?.classes || 0, icon: Layers, gradient: 'from-violet-500 to-violet-600' },
        { title: 'Total Subjects', value: dashboard?.subjects || stats?.subjects || 0, icon: BookOpen, gradient: 'from-amber-500 to-amber-600' },
        { title: 'Assignments', value: dashboard?.assignments || 0, icon: ClipboardList, gradient: 'from-pink-500 to-pink-600' },
        { title: 'Announcements', value: dashboard?.announcements || 0, icon: Bell, gradient: 'from-cyan-500 to-cyan-600' },
    ]

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

    return (
        <div className="p-4 lg:p-6 animate-fade-in text-slate-700">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.name} 👋</h1>
                <p className="text-sm text-slate-500 mt-1">Here's an overview of your school</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all group">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{card.value}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" /> Performance by Subject</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.performanceChart || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1385c5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1385c5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="averageScore" stroke="#1385c5" fill="url(#colorScore)" strokeWidth={2} name="Average Score (%)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2"><Bell className="w-5 h-5 text-warning-500" /> Recent Activity</h2>
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                        {(dashboard?.recentActivity || []).length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
                        ) : (
                            (dashboard?.recentActivity || []).map((act: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold 
                                        ${act.type === 'assignment' ? 'bg-pink-100 text-pink-600' : act.type === 'announcement' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                                        {act.type === 'assignment' ? '📝' : act.type === 'announcement' ? '📢' : '🔔'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{act.title}</p>
                                        <p className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleDateString()}</p>
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
