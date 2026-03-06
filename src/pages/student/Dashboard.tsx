import { useState } from 'react'
import { BookOpen, Clock, Trophy, ArrowRight, Loader2, CheckCircle2, AlertCircle, ClipboardList, Video, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'

interface Quiz {
    id: string
    title: string
    duration: number
    subject: { name: string; color: string }
    _count: { questions: number }
}

interface Question {
    id: string
    text: string
    type: string
    options: string[]
    correctAnswer: string
    explanation?: string
}

interface QuizWithQuestions extends Quiz {
    questions: Question[]
}

export default function StudentDashboard({ user }: { user: any }) {
    const [activeQuiz, setActiveQuiz] = useState<QuizWithQuestions | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    // Fetch Published Quizzes
    const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
        queryKey: ['available-quizzes'],
        queryFn: async () => {
            const res = await fetch('/api/quizzes')
            if (!res.ok) throw new Error('Failed to fetch quizzes')
            return res.json()
        }
    })

    // Start Quiz Mutation
    const startQuizMutation = useMutation({
        mutationFn: async (quizId: string) => {
            const res = await fetch(`/api/quizzes/${quizId}`)
            if (!res.ok) throw new Error('Failed to fetch quiz details')
            return res.json()
        },
        onSuccess: (data) => {
            setActiveQuiz(data)
            setCurrentQuestionIndex(0)
            setAnswers({})
            setIsSubmitted(false)
        }
    })

    // Submit Results Mutation
    const submitMutation = useMutation({
        mutationFn: async (result: { quizId: string, studentId: string, score: number, maxScore: number }) => {
            const res = await fetch('/api/quizzes/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            })
            if (!res.ok) throw new Error('Failed to submit')
            return res.json()
        }
    })

    const handleSelectOption = (questionId: string, option: string) => {
        if (isSubmitted) return
        setAnswers(prev => ({ ...prev, [questionId]: option }))
    }

    const handleNext = () => {
        if (!activeQuiz) return
        if (currentQuestionIndex < activeQuiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            let correctCount = 0
            activeQuiz.questions.forEach(q => {
                if (answers[q.id] === q.correctAnswer) correctCount++
            })
            const finalScore = correctCount
            setScore(finalScore)
            setIsSubmitted(true)
            submitMutation.mutate({
                quizId: activeQuiz.id,
                studentId: user.id,
                score: finalScore,
                maxScore: activeQuiz.questions.length
            })
        }
    }

    if (activeQuiz) {
        const currentQuestion = activeQuiz.questions[currentQuestionIndex]
        const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100

        return (
            <div className="max-w-3xl mx-auto animate-fade-in text-slate-700 p-4 lg:p-0">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{activeQuiz.title}</h1>
                        <p className="text-slate-500 text-sm">{activeQuiz.subject.name} • Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-bold text-sm shadow-sm">
                        <Clock className="w-4 h-4" />
                        <span>{activeQuiz.duration}m</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>

                {!isSubmitted ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-8">
                            <h2 className="text-lg font-semibold text-slate-800 mb-7 leading-relaxed">{currentQuestion.text}</h2>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option) => (
                                    <button key={option} onClick={() => handleSelectOption(currentQuestion.id, option)}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                                        ${answers[currentQuestion.id] === option
                                                ? 'border-primary-500 bg-primary-50/60 text-primary-700 shadow-md shadow-primary-500/10'
                                                : 'border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                        <span className="font-medium text-sm">{option}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                        ${answers[currentQuestion.id] === option
                                                ? 'border-primary-500 bg-primary-500 text-white scale-110'
                                                : 'border-slate-200 group-hover:border-slate-300'}`}>
                                            {answers[currentQuestion.id] === option && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button onClick={handleNext} disabled={!answers[currentQuestion.id]}
                                className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-[0.97]">
                                {currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-12 text-center animate-scale-in">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${score / activeQuiz.questions.length >= 0.7 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            <Trophy className={`w-12 h-12 ${score / activeQuiz.questions.length >= 0.7 ? 'text-emerald-500' : 'text-amber-500'}`} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Quiz Completed!</h2>
                        <p className="text-slate-500 mb-8">Great job completing the assessment.</p>

                        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-10">
                            <div className="p-6 bg-slate-50 rounded-2xl"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Score</p><p className="text-3xl font-bold text-slate-800">{score}/{activeQuiz.questions.length}</p></div>
                            <div className="p-6 bg-slate-50 rounded-2xl"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Grade</p><p className={`text-3xl font-bold ${score / activeQuiz.questions.length >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round((score / activeQuiz.questions.length) * 100)}%</p></div>
                        </div>

                        <button onClick={() => setActiveQuiz(null)} className="btn-outline px-10">Back to Dashboard</button>
                    </div>
                )}
            </div>
        )
    }

    // Dashboard stats
    const { data: dashboard } = useQuery({
        queryKey: ['student-dashboard', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/student/${user.id}`)
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    const quickCards = [
        { title: 'Assignments Due', value: dashboard?.assignmentsDue || 0, icon: ClipboardList, gradient: 'from-rose-500 to-pink-500', text: 'text-rose-600' },
        { title: 'Average Grade', value: `${dashboard?.avgGrade || 0}%`, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600' },
        { title: 'Upcoming Classes', value: dashboard?.upcomingClasses || 0, icon: Video, gradient: 'from-violet-500 to-purple-500', text: 'text-violet-600' },
        { title: 'Quizzes Taken', value: dashboard?.quizzesTaken || 0, icon: Trophy, gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600' },
    ]

    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
    const greeting = timeOfDay === 'morning' ? '🌅 Good morning' : timeOfDay === 'afternoon' ? '☀️ Good afternoon' : '🌙 Good evening'

    return (
        <div className="animate-fade-in text-slate-700">
            {/* Welcome Banner */}
            <div className="relative bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 gradient-animate rounded-2xl p-6 sm:p-8 mb-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjA1IiBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L3N2Zz4=')] opacity-50" />
                <div className="relative flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <p className="text-white/70 text-sm font-medium">{greeting},</p>
                </div>
                <h1 className="relative text-2xl sm:text-3xl font-bold tracking-tight mt-1">{user.name}</h1>
                <p className="relative text-white/50 text-sm mt-2">Pick up where you left off or start a new assessment.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {quickCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <ArrowUpRight className={`w-4 h-4 ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{card.value}</h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Quizzes */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800">Available Assessments</h2>
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg font-bold">{quizzes.length} Total</span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizzes.map((quiz) => (
                                <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quiz.subject.color || 'from-primary-400 to-primary-600'} 
                                                 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 mb-1">{quiz.title}</h3>
                                    <p className="text-sm text-slate-400 mb-5">{quiz.subject.name}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{quiz._count.questions} Qs</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration}m</span>
                                        </div>
                                        <button onClick={() => startQuizMutation.mutate(quiz.id)} disabled={startQuizMutation.isPending}
                                            className="p-2.5 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95">
                                            {startQuizMutation.isPending && startQuizMutation.variables === quiz.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {quizzes.length === 0 && (
                                <div className="col-span-full py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">No quizzes available at the moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress Sidebar */}
                <div className="space-y-5">
                    <h2 className="text-base font-bold text-slate-800">Your Progress</h2>
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20">
                        <Trophy className="w-10 h-10 mb-4 opacity-30" />
                        <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">Average Score</p>
                        <h3 className="text-4xl font-bold mb-5 tracking-tight">{dashboard?.avgGrade || 0}%</h3>
                        <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-700 ease-out" style={{ width: `${dashboard?.avgGrade || 0}%` }} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5">
                        <h4 className="font-bold text-slate-800 text-sm mb-4">Recent Activity</h4>
                        <div className="space-y-4">
                            {(dashboard?.recentActivity || []).length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                            ) : (
                                (dashboard?.recentActivity || []).map((act: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${act.type === 'assignment' ? 'bg-amber-400' : 'bg-primary-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{act.title}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{new Date(act.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
