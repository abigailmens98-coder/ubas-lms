import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { User } from '../App'
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    GraduationCap,
    BookOpen,
    CalendarDays,
    CalendarClock,
    Bell,
    Menu,
} from 'lucide-react'
import Notifications from '../components/Notifications'

interface AdminLayoutProps {
    user: User
    onLogout: () => void
}

const adminNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'Classes', path: '/classes', icon: GraduationCap },
    { label: 'Subjects', path: '/subjects', icon: BookOpen },
    { label: 'Terms', path: '/terms', icon: CalendarDays },
    { label: 'Timetable', path: '/timetable', icon: CalendarClock },
    { label: 'Announcements', path: '/announcements', icon: Bell },
]

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#F7F8FC]">
            <Sidebar
                user={user}
                portalLabel="Admin Portal"
                navItems={adminNavItems}
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
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
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

