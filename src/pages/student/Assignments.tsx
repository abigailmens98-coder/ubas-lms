import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileUp, BookOpen, Clock, CheckCircle2, Loader2, Calendar } from 'lucide-react'

export default function StudentAssignments({ user }: { user: any }) {
    const queryClient = useQueryClient()
    const [uploadingId, setUploadingId] = useState<string | null>(null)

    const { data: assignmentsData = [], isLoading } = useQuery({
        queryKey: ['student-assignments', user.id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/assignments?role=student&userId=${user.id}`)
            if (!res.ok) throw new Error('Failed to fetch assignments')
            return res.json()
        }
    })
    const assignments = Array.isArray(assignmentsData) ? assignmentsData : []

    const submitMutation = useMutation({
        mutationFn: async ({ id, fileUrl }: { id: string, fileUrl: string }) => {
            const res = await fetch(`http://localhost:3001/api/assignments/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: user.id, fileUrl })
            })
            if (!res.ok) throw new Error('Submission failed')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-assignments', user.id] })
            setUploadingId(null)
            alert('Assignment submitted successfully!')
        }
    })

    const handleFileUpload = async (id: string, file: File) => {
        setUploadingId(id)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const uploadRes = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData
            })
            if (!uploadRes.ok) throw new Error('File upload failed')
            const { fileUrl } = await uploadRes.json()
            submitMutation.mutate({ id, fileUrl })
        } catch (error) {
            alert('Upload failed. Try again.')
            setUploadingId(null)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
    }

    return (
        <div className="p-4 sm:p-6 text-slate-700 animate-fade-in">
            <h1 className="text-2xl font-bold mb-1 sm:mb-2 text-slate-800">Assignments</h1>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">View and submit your pending homework</p>

            <div className="space-y-6">
                {assignments.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-slate-700">No Assignments Yet</h2>
                        <p className="text-slate-500">You are all caught up!</p>
                    </div>
                )}
                {assignments.map((assignment: any) => {
                    const submission = assignment.submissions?.find((s: any) => s.studentId === user.id)
                    const isOverdue = new Date(assignment.dueDate) < new Date() && !submission

                    return (
                        <div key={assignment.id} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 sm:gap-6">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center
                                ${submission ? 'bg-success-100 text-success-600' : isOverdue ? 'bg-danger-100 text-danger-600' : 'bg-primary-100 text-primary-600'}`}>
                                {submission ? <CheckCircle2 className="w-7 h-7" /> : isOverdue ? <Clock className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-3 sm:gap-4 mb-2">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-800">{assignment.title}</h3>
                                        <p className="text-xs sm:text-sm font-medium text-slate-500">{assignment.subject?.name}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5
                                        ${submission ? 'bg-success-50 text-success-700 border border-success-200' :
                                            isOverdue ? 'bg-danger-50 text-danger-700 border border-danger-200' :
                                                'bg-warning-50 text-warning-700 border border-warning-200'}`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        {submission ? 'Submitted' : `Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm mt-3">{assignment.description}</p>

                                {assignment.fileUrl && (
                                    <a href={`http://localhost:3001${assignment.fileUrl}`} target="_blank" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700">
                                        <FileUp className="w-4 h-4" />
                                        Download Attachment
                                    </a>
                                )}

                                {!submission && (
                                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
                                        <label className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer transition-colors font-semibold text-sm">
                                            {uploadingId === assignment.id ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> : <FileUp className="w-4 h-4 text-primary-500" />}
                                            {uploadingId === assignment.id ? 'Uploading...' : 'Upload Submission'}
                                            <input type="file" className="hidden" onChange={(e) => {
                                                if (e.target.files?.[0]) handleFileUpload(assignment.id, e.target.files[0])
                                            }} />
                                        </label>
                                    </div>
                                )}

                                {submission && submission.grade && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-sm text-slate-700"><span className="font-semibold">Grade:</span> {submission.grade}%</p>
                                        {submission.feedback && <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Feedback:</span> {submission.feedback}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
