import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BookOpen, Layers, Award, Loader2, Users } from 'lucide-react'

export default function TeacherDashboard({ user }: { user: any }) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['teacher-stats', user.id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/stats/teacher/${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch teacher stats')
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
        { title: 'My Subjects', value: stats?.subjects || 0, icon: BookOpen, color: 'bg-blue-500 text-white' },
        { title: 'My Classes', value: stats?.classes || 0, icon: Layers, color: 'bg-green-500 text-white' },
        { title: 'My Quizzes', value: stats?.quizzes || 0, icon: Award, color: 'bg-purple-500 text-white' },
        { title: 'Quiz Attempts', value: stats?.students || 0, icon: Users, color: 'bg-orange-500 text-white' },
    ]

    const COLORS = ['#8884d8', '#82ca9d', '#FFBB28', '#FF8042', '#0088FE', '#00C49F']

    return (
        <div className="p-6 animate-fade-in text-slate-700">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Teacher Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">{card.title}</p>
                            <h2 className="text-3xl font-bold text-slate-800 mt-1">{card.value}</h2>
                        </div>
                        <div className={`p-4 rounded-2xl ${card.color}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">Assigned Subjects Performance</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.performanceChart || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="averageScore" fill="#8b5cf6" name="Average Score (%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">Student Attempts per Subject</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.performanceChart || []}
                                    dataKey="attempts"
                                    nameKey="subject"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {(stats?.performanceChart || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
