import { NavLink } from 'react-router-dom'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { User } from '../App'

interface NavItem {
    label: string
    path: string
    icon: LucideIcon
    hasSubmenu?: boolean
}

interface SidebarProps {
    user: User
    portalLabel: string
    navItems: NavItem[]
    onLogout: () => void
    isOpen?: boolean
    onClose?: () => void
}

export default function Sidebar({ user, portalLabel, navItems, onLogout, isOpen = false, onClose }: SidebarProps) {
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-slate-100 flex flex-col z-50 shadow-sidebar transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0">
                            <img src="/badge.png" alt="UBaS Logo" className="w-full h-full object-contain scale-110" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 leading-tight">UBaS LMS</h1>
                            <p className="text-[10px] text-primary-500 font-bold tracking-widest uppercase mt-0.5">{portalLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="px-5 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Notifications</span>
                    <button className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger-500 rounded-full"></span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                clsx(
                                    'sidebar-item group',
                                    isActive && 'sidebar-item-active'
                                )
                            }
                        >
                            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.hasSubmenu && (
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 
                          flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Additional Links */}
                    <div className="mt-1 space-y-0.5">
                        <NavLink to="/profile" className={({ isActive }) => clsx('sidebar-item w-full text-left', isActive ? 'sidebar-item-active' : 'text-slate-500')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profile</span>
                        </NavLink>
                        <button
                            onClick={onLogout}
                            className="sidebar-item w-full text-left text-slate-500 hover:text-danger-500 hover:bg-danger-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
