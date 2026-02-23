import { useQuery } from '@tanstack/react-query'
import { Award, Loader2, Trophy, BarChart, FileText } from 'lucide-react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function StudentGrades({ user }: { user: any }) {
    const { data: stats = {}, isLoading } = useQuery({
        queryKey: ['student-stats', user.id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/stats/student/${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch grades')
            return res.json()
        }
    })

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
    }

    const mockGrades = [
        { subject: 'Mathematics', grade: 'A', score: 92 },
        { subject: 'Science', grade: 'B+', score: 88 },
        { subject: 'English', grade: 'A-', score: 90 },
        { subject: 'Programming', grade: 'A+', score: 98 },
    ]

    const chartData = mockGrades.map(g => ({ subject: g.subject, score: g.score }))

    return (
        <div className="p-6 text-slate-700 animate-fade-in">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">Grades & Performance</h1>
            <p className="text-slate-500 mb-8">View your report card and overall analytics</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-3xl shadow-primary text-white">
                    <Trophy className="w-10 h-10 mb-4 opacity-70" />
                    <p className="text-primary-100 font-medium mb-1">Overall Average</p>
                    <h2 className="text-4xl font-bold">92%</h2>
                    <p className="text-sm text-primary-200 mt-2 font-semibold tracking-wider uppercase">Excellent</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <Award className="w-10 h-10 mb-4 text-warning-500" />
                    <p className="text-slate-500 font-medium mb-1">Total Assessments Done</p>
                    <h2 className="text-3xl font-bold text-slate-800">12</h2>
                    <p className="text-sm text-success-500 mt-2 font-semibold">↑ 3 this week</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <BarChart className="w-10 h-10 mb-4 text-purple-500" />
                    <p className="text-slate-500 font-medium mb-1">Class Rank</p>
                    <h2 className="text-3xl font-bold text-slate-800">4th</h2>
                    <p className="text-sm text-slate-400 mt-2 font-semibold">Out of 32 students</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        Detailed Report Card
                    </h3>

                    <div className="space-y-4">
                        {mockGrades.map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                <div className="font-semibold text-slate-700">{g.subject}</div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-slate-800">{g.score}%</span>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                        ${g.grade.includes('A') ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                                        {g.grade}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-purple-500" />
                        Performance Chart
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 100]} />
                                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="score" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
