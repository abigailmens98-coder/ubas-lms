import { useState } from 'react'
import { BookOpen, Clock, Trophy, ArrowRight, Loader2, CheckCircle2, AlertCircle, ClipboardList, Video, TrendingUp } from 'lucide-react'
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

    // Start Quiz Mutation (to fetch questions)
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
            // Calculate score
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
            <div className="max-w-3xl mx-auto animate-fade-in text-slate-700">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{activeQuiz.title}</h1>
                        <p className="text-slate-500">{activeQuiz.subject.name} • Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>{activeQuiz.duration}m</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {!isSubmitted ? (
                    <div className="space-y-6">
                        <div className="content-card p-8">
                            <h2 className="text-lg font-semibold text-slate-800 mb-6">
                                {currentQuestion.text}
                            </h2>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleSelectOption(currentQuestion.id, option)}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                      ${answers[currentQuestion.id] === option
                                                ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-sm'
                                                : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}
                                    >
                                        <span className="font-medium">{option}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${answers[currentQuestion.id] === option
                                                ? 'border-primary-500 bg-primary-500 text-white'
                                                : 'border-slate-200 group-hover:border-slate-300'}`}>
                                            {answers[currentQuestion.id] === option && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion.id]}
                                className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50"
                            >
                                {currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="content-card p-12 text-center animate-scale-in">
                        <div className="w-20 h-20 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Completed!</h2>
                        <p className="text-slate-500 mb-8">Great job completing the assessment.</p>

                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
                            <div className="p-6 bg-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Score</p>
                                <p className="text-3xl font-bold text-slate-800">{score}/{activeQuiz.questions.length}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Grade</p>
                                <p className="text-3xl font-bold text-success-600">
                                    {Math.round((score / activeQuiz.questions.length) * 100)}%
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveQuiz(null)}
                            className="btn-outline px-10"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // Fetch dashboard stats
    const { data: dashboard } = useQuery({
        queryKey: ['student-dashboard', user.id],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/student/${user.id}`)
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    const quickCards = [
        { title: 'Assignments Due', value: dashboard?.assignmentsDue || 0, icon: ClipboardList, gradient: 'from-pink-500 to-pink-600' },
        { title: 'Average Grade', value: `${dashboard?.avgGrade || 0}%`, icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
        { title: 'Upcoming Classes', value: dashboard?.upcomingClasses || 0, icon: Video, gradient: 'from-violet-500 to-violet-600' },
        { title: 'Quizzes Taken', value: dashboard?.quizzesTaken || 0, icon: Trophy, gradient: 'from-amber-500 to-amber-600' },
    ]

    return (
        <div className="animate-fade-in text-slate-700">
            <div className="page-header mb-6">
                <h1 className="page-title text-primary-500">Welcome back, {user.name}! 👋</h1>
                <p className="page-subtitle">Pick up where you left off or start a new assessment.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {quickCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all group">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{card.value}</h2>
                        <p className="text-xs text-slate-500 font-medium">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Quizzes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Available Assessments</h2>
                        <span className="text-sm font-medium text-primary-600">{quizzes.length} Total</span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {quizzes.map((quiz) => (
                                <div key={quiz.id} className="content-card group hover:shadow-card-hover transition-all duration-300">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${quiz.subject.color || 'from-primary-400 to-primary-600'} 
                                 flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform`}>
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{quiz.title}</h3>
                                    <p className="text-sm text-slate-400 mb-6">{quiz.subject.name}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{quiz._count.questions} Qs</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration}m</span>
                                        </div>
                                        <button
                                            onClick={() => startQuizMutation.mutate(quiz.id)}
                                            disabled={startQuizMutation.isPending}
                                            className="p-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                                        >
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
                                <div className="col-span-full py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No quizzes available at the moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Stats / Feedback */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">Your Progress</h2>
                    <div className="content-card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none shadow-primary-xl">
                        <Trophy className="w-10 h-10 mb-4 opacity-50" />
                        <p className="text-primary-100 text-sm font-medium mb-1">Average Score</p>
                        <h3 className="text-3xl font-bold mb-6">{dashboard?.avgGrade || 0}% <span className="text-sm font-normal text-primary-200 ml-1">Overall</span></h3>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all duration-500" style={{ width: `${dashboard?.avgGrade || 0}%` }} />
                        </div>
                    </div>

                    <div className="content-card p-6">
                        <h4 className="font-bold text-slate-800 mb-4">Recent Activity</h4>
                        <div className="space-y-4">
                            {(dashboard?.recentActivity || []).length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                            ) : (
                                (dashboard?.recentActivity || []).map((act: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${act.type === 'assignment' ? 'bg-warning-500' : 'bg-primary-500'}`} />
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
