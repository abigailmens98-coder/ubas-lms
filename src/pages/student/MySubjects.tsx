import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, FileText, Download, Loader2, PlayCircle, FolderOpen } from 'lucide-react'

export default function StudentSubjects({ user }: { user: any }) {
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

    const { data: userClass, isLoading: loadingClass } = useQuery({
        queryKey: ['student-class', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/users/${user.id}`)
            if (!res.ok) return null
            return res.json()
        }
    })

    const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
        queryKey: ['student-subjects', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/subjects`)
            if (!res.ok) throw new Error()
            return res.json()
        }
    })

    const { data: lessons = [], isLoading: loadingLessons } = useQuery({
        queryKey: ['student-lessons', selectedSubject],
        queryFn: async () => {
            if (!selectedSubject) return []
            const res = await fetch(`/api/lessons?subjectId=${selectedSubject}`)
            if (!res.ok) throw new Error()
            return res.json()
        },
        enabled: !!selectedSubject
    })

    if (loadingClass || loadingSubjects || (selectedSubject && loadingLessons)) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
    }

    // In a real app we'd filter subjects by the user's class
    // Here we'll just show all subjects for demonstration if class association isn't fully seeded
    const displaySubjects = subjects

    return (
        <div className="p-6 text-slate-700 animate-fade-in flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                <h1 className="text-2xl font-bold mb-2 text-slate-800">My Subjects</h1>
                <p className="text-slate-500 mb-8">Browse lessons and course materials</p>

                <div className="space-y-4">
                    {displaySubjects.length === 0 && (
                        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
                            No subjects assigned yet.
                        </div>
                    )}
                    {displaySubjects.map((subject: any) => (
                        <button
                            key={subject.id}
                            onClick={() => setSelectedSubject(subject.id)}
                            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all outline-none
                                ${selectedSubject === subject.id ? 'bg-primary-50 border-primary-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subject.color || 'from-primary-400 to-primary-600'} flex items-center justify-center shadow-md`}>
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{subject.name}</h3>
                                    <p className="text-xs font-semibold text-slate-400">{subject.code || 'SUB'}</p>
                                </div>
                            </div>
                            <FolderOpen className={`w-5 h-5 ${selectedSubject === subject.id ? 'text-primary-500' : 'text-slate-300'}`} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="md:w-2/3 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 min-h-[500px]">
                {selectedSubject ? (
                    <>
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Lessons & Materials</h2>
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{lessons.length} Modules</span>
                        </div>

                        <div className="space-y-6">
                            {lessons.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="font-semibold text-slate-500">No lessons uploaded yet.</p>
                                    <p className="text-sm">Check back later when your teacher posts materials.</p>
                                </div>
                            )}
                            {lessons.map((lesson: any, index: number) => (
                                <div key={lesson.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800">{lesson.title}</h3>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">
                                            {new Date(lesson.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{lesson.content}</p>

                                    {lesson.attachmentUrl && (
                                        <a href={`${lesson.attachmentUrl}`} target="_blank" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors text-primary-600 w-full sm:w-auto">
                                            <Download className="w-4 h-4" />
                                            Download Attachment
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <FolderOpen className="w-16 h-16 text-slate-200 mb-6" />
                        <h3 className="text-lg font-semibold text-slate-600">Select a subject</h3>
                        <p className="text-sm">Choose a subject from the sidebar to view its lessons</p>
                    </div>
                )}
            </div>
        </div>
    )
}
