import { Outlet } from 'react-router-dom'
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
    { label: 'Live Classes', path: '/live-classes', icon: Video },
    { label: 'Grades', path: '/grades', icon: Award },
]

export default function StudentLayout({ user, onLogout }: StudentLayoutProps) {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Sidebar
                user={user}
                portalLabel="Student Portal"
                navItems={studentNavItems}
                onLogout={onLogout}
            />
            <main className="ml-[240px] flex flex-col min-h-screen">
                <header className="h-[73px] flex items-center justify-end px-8 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-4">
                        <Notifications userId={user.id} />
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold border border-primary-200">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>
                <div className="p-8 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
