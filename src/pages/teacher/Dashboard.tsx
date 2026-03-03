import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BookOpen, Layers, Award, Loader2, Users, ClipboardList, Video, FileText } from 'lucide-react'

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
        { title: 'My Subjects', value: dashboard?.subjects || stats?.subjects || 0, icon: BookOpen, gradient: 'from-blue-500 to-blue-600' },
        { title: 'My Classes', value: dashboard?.classes || stats?.classes || 0, icon: Layers, gradient: 'from-emerald-500 to-emerald-600' },
        { title: 'Assignments', value: dashboard?.assignments || 0, icon: ClipboardList, gradient: 'from-pink-500 to-pink-600' },
        { title: 'Upcoming Classes', value: dashboard?.liveClasses || 0, icon: Video, gradient: 'from-violet-500 to-violet-600' },
    ]

    const COLORS = ['#1385c5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

    return (
        <div className="p-4 lg:p-6 animate-fade-in text-slate-700">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.name} 👋</h1>
                <p className="text-sm text-slate-500 mt-1">Here's your teaching overview</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{card.value}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">Subject Performance</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.performanceChart || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="averageScore" fill="#1385c5" name="Average Score (%)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">Quiz Attempts by Subject</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats?.performanceChart || []} dataKey="attempts" nameKey="subject" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>
                                    {(stats?.performanceChart || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-500" /> Recent Submissions</h2>
                {(dashboard?.recentSubmissions || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No recent submissions</p>
                ) : (
                    <div className="space-y-3">
                        {(dashboard?.recentSubmissions || []).map((sub: any) => (
                            <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-success-100 text-success-600 flex items-center justify-center font-bold text-sm">
                                        {sub.student?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{sub.student?.name}</p>
                                        <p className="text-xs text-slate-500">{sub.assignment?.title}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
