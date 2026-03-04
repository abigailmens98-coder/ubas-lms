import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Clock, Loader2, Users, Save, BarChart3, Calendar } from 'lucide-react'

const statusConfig = {
    PRESENT: { color: 'bg-success-100 text-success-700 border-success-200', icon: CheckCircle2, label: 'Present' },
    ABSENT: { color: 'bg-danger-100 text-danger-700 border-danger-200', icon: XCircle, label: 'Absent' },
    LATE: { color: 'bg-warning-100 text-warning-700 border-warning-200', icon: Clock, label: 'Late' },
}

export default function Attendance({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({})
    const [showSummary, setShowSummary] = useState(false)

    // Fetch classes managed by this teacher
    const { data: classes = [] } = useQuery({
        queryKey: ['teacher-classes', user.id],
        queryFn: async () => {
            const res = await fetch('/api/classes')
            if (!res.ok) throw new Error()
            const all = await res.json()
            // Show classes where user is the class teacher, or all for admin
            return user.role === 'admin' ? all : all.filter((c: any) => c.teacherId === user.id)
        }
    })

    // Fetch students for selected class
    const { data: students = [], isLoading: loadingStudents } = useQuery({
        queryKey: ['class-students', selectedClassId],
        queryFn: async () => {
            const res = await fetch(`/api/users?role=STUDENT&classId=${selectedClassId}`)
            if (!res.ok) throw new Error()
            return res.json()
        },
        enabled: !!selectedClassId
    })

    // Fetch existing attendance for this class + date
    const { data: existingAttendance = [] } = useQuery({
        queryKey: ['attendance', selectedClassId, selectedDate],
        queryFn: async () => {
            const res = await fetch(`/api/attendance?classId=${selectedClassId}&date=${selectedDate}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            // Pre-fill attendanceMap
            const map: Record<string, string> = {}
            data.forEach((r: any) => { map[r.studentId] = r.status })
            setAttendanceMap(map)
            return data
        },
        enabled: !!selectedClassId && !!selectedDate
    })

    // Fetch summary
    const { data: summary = [] } = useQuery({
        queryKey: ['attendance-summary', selectedClassId],
        queryFn: async () => {
            const res = await fetch(`/api/attendance/summary/${selectedClassId}`)
            if (!res.ok) throw new Error()
            return res.json()
        },
        enabled: !!selectedClassId && showSummary
    })

    const saveMutation = useMutation({
        mutationFn: async () => {
            const records = Object.entries(attendanceMap).map(([studentId, status]) => ({ studentId, status }))
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records, classId: selectedClassId, date: selectedDate, markedById: user.id })
            })
            if (!res.ok) throw new Error()
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            alert(`Attendance saved for ${data.saved} students!`)
        }
    })

    const toggleStatus = (studentId: string) => {
        const current = attendanceMap[studentId] || 'PRESENT'
        const cycle = ['PRESENT', 'ABSENT', 'LATE']
        const next = cycle[(cycle.indexOf(current) + 1) % cycle.length]
        setAttendanceMap(prev => ({ ...prev, [studentId]: next }))
    }

    const markAll = (status: string) => {
        const map: Record<string, string> = {}
        students.forEach((s: any) => { map[s.id] = status })
        setAttendanceMap(map)
    }

    const presentCount = Object.values(attendanceMap).filter(s => s === 'PRESENT').length
    const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length
    const lateCount = Object.values(attendanceMap).filter(s => s === 'LATE').length

    return (
        <div className="p-4 lg:p-6 text-slate-700 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
                    <p className="text-sm text-slate-500">Mark daily student attendance</p>
                </div>
                {selectedClassId && (
                    <button onClick={() => setShowSummary(!showSummary)}
                        className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm transition-all ${showSummary ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        <BarChart3 className="w-4 h-4" /> {showSummary ? 'Take Attendance' : 'View Summary'}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Class</label>
                        <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setAttendanceMap({}) }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-slate-50">
                            <option value="">Choose a class...</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-slate-50" />
                    </div>
                </div>
            </div>

            {!selectedClassId ? (
                <div className="p-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Select a class to begin taking attendance</p>
                </div>
            ) : showSummary ? (
                /* Summary View */
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800">Attendance Summary</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left p-4 font-semibold text-slate-600">Student</th>
                                    <th className="text-center p-4 font-semibold text-success-600">Present</th>
                                    <th className="text-center p-4 font-semibold text-danger-600">Absent</th>
                                    <th className="text-center p-4 font-semibold text-warning-600">Late</th>
                                    <th className="text-center p-4 font-semibold text-slate-600">Total</th>
                                    <th className="text-center p-4 font-semibold text-primary-600">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.map((s: any) => (
                                    <tr key={s.studentId} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="p-4 font-semibold text-slate-800">{s.name}</td>
                                        <td className="p-4 text-center text-success-600 font-bold">{s.present}</td>
                                        <td className="p-4 text-center text-danger-600 font-bold">{s.absent}</td>
                                        <td className="p-4 text-center text-warning-600 font-bold">{s.late}</td>
                                        <td className="p-4 text-center text-slate-600">{s.total}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${s.total > 0 && (s.present / s.total) >= 0.8 ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                                                {s.total > 0 ? Math.round((s.present / s.total) * 100) : 0}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {summary.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No attendance records yet</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Take Attendance View */
                <div>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button onClick={() => markAll('PRESENT')} className="p-3 rounded-xl bg-success-50 border border-success-200 text-center hover:bg-success-100 transition-colors">
                            <p className="text-2xl font-bold text-success-700">{presentCount}</p>
                            <p className="text-xs font-semibold text-success-600">Present</p>
                        </button>
                        <button onClick={() => markAll('ABSENT')} className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-center hover:bg-danger-100 transition-colors">
                            <p className="text-2xl font-bold text-danger-700">{absentCount}</p>
                            <p className="text-xs font-semibold text-danger-600">Absent</p>
                        </button>
                        <button onClick={() => markAll('LATE')} className="p-3 rounded-xl bg-warning-50 border border-warning-200 text-center hover:bg-warning-100 transition-colors">
                            <p className="text-2xl font-bold text-warning-700">{lateCount}</p>
                            <p className="text-xs font-semibold text-warning-600">Late</p>
                        </button>
                    </div>

                    {loadingStudents ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="divide-y divide-slate-50">
                                {students.map((student: any, i: number) => {
                                    const status = attendanceMap[student.id] || 'PRESENT'
                                    const config = statusConfig[status as keyof typeof statusConfig]
                                    const Icon = config.icon

                                    return (
                                        <div key={student.id} onClick={() => toggleStatus(student.id)}
                                            className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400 font-bold w-6">{i + 1}.</span>
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {student.avatar ? <img src={student.avatar} className="w-full h-full rounded-full object-cover" /> : student.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                                                    <p className="text-[10px] text-slate-400">{student.email}</p>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${config.color} transition-all group-hover:scale-105`}>
                                                <Icon className="w-4 h-4" />
                                                {config.label}
                                            </div>
                                        </div>
                                    )
                                })}
                                {students.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                        <p className="font-medium">No students in this class</p>
                                    </div>
                                )}
                            </div>

                            {students.length > 0 && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50">
                                    <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || Object.keys(attendanceMap).length === 0}
                                        className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                                        {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Attendance</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
