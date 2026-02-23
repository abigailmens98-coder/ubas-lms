import { useState } from 'react'
import { Search, Users } from 'lucide-react'

interface Student {
    id: string
    name: string
    email: string
    class: string
    performance: 'excellent' | 'good' | 'average' | 'needs-improvement'
}

const mockStudents: Student[] = [
    { id: '1', name: 'Festus Wilson', email: 'festuswilson08@gmail.com', class: 'JHS 1A', performance: 'good' },
    { id: '2', name: 'Sarah Kwofie', email: 'kwofiesarah43@gmail.com', class: 'JHS 1A', performance: 'excellent' },
    { id: '3', name: 'Emmanuel Asante', email: 'easante@gmail.com', class: 'JHS 2A', performance: 'average' },
    { id: '4', name: 'Grace Boateng', email: 'graceb@gmail.com', class: 'JHS 2A', performance: 'good' },
    { id: '5', name: 'Joseph Mensah', email: 'jmensah@gmail.com', class: 'JHS 3A', performance: 'excellent' },
    { id: '6', name: 'Ama Darko', email: 'amadarko@gmail.com', class: 'JHS 1B', performance: 'needs-improvement' },
]

const perfColors = {
    'excellent': 'bg-success-100 text-success-700',
    'good': 'bg-primary-100 text-primary-700',
    'average': 'bg-warning-100 text-warning-700',
    'needs-improvement': 'bg-danger-100 text-danger-700',
}

const getAvatarColor = (name: string) => {
    const colors = ['from-primary-400 to-primary-600', 'from-success-400 to-success-600', 'from-purple-400 to-purple-600',
        'from-warning-400 to-warning-600', 'from-danger-400 to-danger-500', 'from-sky-400 to-sky-600', 'from-pink-400 to-pink-600']
    return colors[name.charCodeAt(0) % colors.length]
}

export default function TeacherStudents() {
    const [search, setSearch] = useState('')
    const [classFilter, setClassFilter] = useState('all')

    const filtered = mockStudents.filter((s) => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
        const matchClass = classFilter === 'all' || s.class === classFilter
        return matchSearch && matchClass
    })

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">My Students</h1>
                <p className="page-subtitle">Students in your assigned classes</p>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
                </div>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
                    <option value="all">All Classes</option>
                    <option value="JHS 1A">JHS 1A</option>
                    <option value="JHS 1B">JHS 1B</option>
                    <option value="JHS 2A">JHS 2A</option>
                    <option value="JHS 3A">JHS 3A</option>
                </select>
            </div>

            <div className="content-card p-0 overflow-hidden">
                {filtered.map((student, index) => (
                    <div key={student.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors
                        ${index !== filtered.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(student.name)} flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <span className="text-white font-semibold text-sm">{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.email}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs rounded-md font-medium">{student.class}</span>
                        <span className={`badge ${perfColors[student.performance]}`}>{student.performance.replace('-', ' ')}</span>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center py-12">
                        <Users className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-400">No students found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
