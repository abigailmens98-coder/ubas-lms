import { BookOpen } from 'lucide-react'

const subjects = [
    { id: '1', name: 'Integrated Science', code: 'SCI', classes: ['JHS 1A', 'JHS 2A', 'JHS 3A'], lessons: 12, students: 108, color: 'from-emerald-400 to-emerald-600' },
    { id: '2', name: 'Computing (ICT)', code: 'ICT', classes: ['JHS 1A', 'JHS 2A'], lessons: 8, students: 70, color: 'from-rose-400 to-rose-600' },
    { id: '3', name: 'Mathematics', code: 'MATH', classes: ['JHS 3A'], lessons: 15, students: 40, color: 'from-blue-400 to-blue-600' },
    { id: '4', name: 'French', code: 'FRN', classes: ['JHS 1B'], lessons: 6, students: 32, color: 'from-cyan-400 to-cyan-600' },
]

export default function TeacherSubjects() {
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">My Subjects</h1>
                <p className="page-subtitle">Subjects assigned to you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {subjects.map((subject, index) => (
                    <div
                        key={subject.id}
                        className="content-card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center shadow-md mb-4`}>
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-0.5">{subject.name}</h3>
                        <p className="text-xs text-slate-400 mb-3">{subject.code}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {subject.classes.map((cls) => (
                                <span key={cls} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md font-medium">{cls}</span>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                            <span>{subject.lessons} Lessons</span>
                            <span>·</span>
                            <span>{subject.students} Students</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
