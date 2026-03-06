import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { User } from '../App'
import {
    LayoutDashboard,
    MessageSquare,
    BookOpen,
    ClipboardList,
    Award,
    Video,
    Bell,
    Menu,
    Trophy,
    FolderOpen,
} from 'lucide-react'
import Notifications from '../components/Notifications'

interface StudentLayoutProps {
    user: User
    onLogout: () => void
}

const studentNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'My Subjects', path: '/my-subjects', icon: BookOpen },
    { label: 'Assignments', path: '/assignments', icon: ClipboardList },
    { label: 'Quizzes', path: '/quizzes', icon: Trophy },
    { label: 'Live Classes', path: '/live-classes', icon: Video },
    { label: 'Grades', path: '/grades', icon: Award },
    { label: 'Resources', path: '/resources', icon: FolderOpen },
]

export default function StudentLayout({ user, onLogout }: StudentLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#F7F8FC]">
            <Sidebar
                user={user}
                portalLabel="Student Portal"
                navItems={studentNavItems}
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="lg:ml-[260px] flex flex-col min-h-screen transition-all duration-300">
                <header className="h-[65px] flex items-center justify-between lg:justify-end px-4 lg:px-8 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 lg:hidden transition-colors">
                        <Menu className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Notifications userId={user.id} />
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>
                <div className="p-4 lg:p-8 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
