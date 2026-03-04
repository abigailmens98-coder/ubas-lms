import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import TeacherLayout from './layouts/TeacherLayout'
import StudentLayout from './layouts/StudentLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminClasses from './pages/admin/Classes'
import AdminSubjects from './pages/admin/Subjects'
import AdminTerms from './pages/admin/Terms'
import AdminTimetable from './pages/admin/Timetable'
import AdminAnnouncements from './pages/admin/Announcements'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherSubjects from './pages/teacher/MySubjects'
import TeacherStudents from './pages/teacher/MyStudents'
import TeacherLessons from './pages/teacher/Lessons'
import TeacherAssignments from './pages/teacher/Assignments'
import TeacherQuizzes from './pages/teacher/Quizzes'
import TeacherLiveClasses from './pages/teacher/LiveClasses'
import StudentDashboard from './pages/student/Dashboard'
import Messages from './pages/Messages'
import StudentSubjects from './pages/student/MySubjects'
import StudentAssignments from './pages/student/Assignments'
import StudentLiveClasses from './pages/student/LiveClasses'
import StudentGrades from './pages/student/Grades'
import Profile from './pages/Profile'
import StudentQuizzes from './pages/student/Quizzes'

export type UserRole = 'admin' | 'teacher' | 'student'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
}

function App() {
    const [user, setUser] = useState<User | null>(null)

    const handleLogin = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
                localStorage.setItem('ubas_user', JSON.stringify(userData))
            } else {
                const error = await response.json()
                alert(error.message || 'Login failed')
            }
        } catch (err) {
            console.error('Login error:', err)
            alert('Could not connect to the server')
        }
    }

    const handleLogout = () => { setUser(null); localStorage.removeItem('ubas_user') }

    const handleUpdateUser = (updatedUser: User) => {
        setUser(updatedUser)
        localStorage.setItem('ubas_user', JSON.stringify(updatedUser))
    }

    if (!user) {
        return <Login onLogin={handleLogin} />
    }

    return (
        <Routes>
            {/* Admin Routes */}
            {user.role === 'admin' && (
                <Route path="/" element={<AdminLayout user={user} onLogout={handleLogout} />}>
                    <Route index element={<AdminDashboard user={user} />} />
                    <Route path="messages" element={<Messages user={user} />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="classes" element={<AdminClasses />} />
                    <Route path="subjects" element={<AdminSubjects />} />
                    <Route path="terms" element={<AdminTerms />} />
                    <Route path="timetable" element={<AdminTimetable />} />
                    <Route path="announcements" element={<AdminAnnouncements user={user} />} />
                    <Route path="profile" element={<Profile user={user} onUpdateUser={handleUpdateUser} />} />
                </Route>
            )}

            {/* Teacher Routes */}
            {user.role === 'teacher' && (
                <Route path="/" element={<TeacherLayout user={user} onLogout={handleLogout} />}>
                    <Route index element={<TeacherDashboard user={user} />} />
                    <Route path="messages" element={<Messages user={user} />} />
                    <Route path="my-subjects" element={<TeacherSubjects />} />
                    <Route path="my-students" element={<TeacherStudents />} />
                    <Route path="lessons" element={<TeacherLessons />} />
                    <Route path="assignments" element={<TeacherAssignments user={user} />} />
                    <Route path="quizzes" element={<TeacherQuizzes />} />
                    <Route path="live-classes" element={<TeacherLiveClasses user={user} />} />
                    <Route path="profile" element={<Profile user={user} onUpdateUser={handleUpdateUser} />} />
                </Route>
            )}

            {/* Student Routes */}
            {user.role === 'student' && (
                <Route path="/" element={<StudentLayout user={user} onLogout={handleLogout} />}>
                    <Route index element={<StudentDashboard user={user} />} />
                    <Route path="messages" element={<Messages user={user} />} />
                    <Route path="my-subjects" element={<StudentSubjects user={user} />} />
                    <Route path="assignments" element={<StudentAssignments user={user} />} />
                    <Route path="live-classes" element={<StudentLiveClasses user={user} />} />
                    <Route path="quizzes" element={<StudentQuizzes user={user} />} />
                    <Route path="grades" element={<StudentGrades user={user} />} />
                    <Route path="profile" element={<Profile user={user} onUpdateUser={handleUpdateUser} />} />
                </Route>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
