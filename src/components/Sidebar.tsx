import { NavLink } from 'react-router-dom'
import { LucideIcon, ChevronRight, LogOut, User } from 'lucide-react'
import { clsx } from 'clsx'
import { User as UserType } from '../App'

interface NavItem {
    label: string
    path: string
    icon: LucideIcon
    hasSubmenu?: boolean
}

interface SidebarProps {
    user: UserType
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
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "fixed left-0 top-0 bottom-0 w-[260px] bg-white/95 backdrop-blur-xl border-r border-slate-100 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 overflow-hidden shrink-0 hover:shadow-lg transition-shadow">
                            <img src="/badge.png" alt="UBaS Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-bold text-slate-800 leading-tight tracking-tight">UBaS LMS</h1>
                            <p className="text-[10px] text-primary-500 font-bold tracking-[0.15em] uppercase mt-0.5">{portalLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={onClose}
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
                                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 
                          flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Action Links */}
                    <div className="mt-2 space-y-0.5">
                        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => clsx('sidebar-item w-full text-left', isActive ? 'sidebar-item-active' : 'text-slate-500')}>
                            <User className="w-[18px] h-[18px]" />
                            <span>Profile</span>
                        </NavLink>
                        <button
                            onClick={onLogout}
                            className="sidebar-item w-full text-left text-slate-500 hover:text-danger-600 hover:bg-danger-50"
                        >
                            <LogOut className="w-[18px] h-[18px]" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
