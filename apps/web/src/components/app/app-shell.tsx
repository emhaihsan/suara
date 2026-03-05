"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Library, Mic, Waves, LogOut, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Voice Library", href: "/library", icon: Library },
    { label: "My Voices", href: "/voices", icon: Mic },
]

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border/50 bg-card">
                {/* Logo */}
                <div className="flex h-14 items-center gap-2.5 px-5">
                    <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
                        <Waves className="size-3.5" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Suara</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5 px-3 py-3">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                                    isActive
                                        ? "bg-black/5 text-foreground dark:bg-white/10"
                                        : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 dark:hover:text-foreground"
                                )}
                            >
                                <Icon className="size-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Theme Toggle bottom */}
                <div className="mt-auto flex items-center justify-between border-t border-border/50 px-5 py-3">
                    <span className="text-xs text-muted-foreground">Appearance</span>
                    <ThemeToggle />
                </div>

                {/* User Menu */}
                <div className="border-t border-border/50 p-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 overflow-hidden">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold uppercase text-primary-foreground">
                                    {user?.name?.slice(0, 2) || "U"}
                                </div>
                                <div className="flex flex-1 flex-col overflow-hidden leading-tight">
                                    <span className="truncate font-semibold text-[13px]">{user?.name}</span>
                                    <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
                                </div>
                                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                <LogOut className="mr-2 size-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 pl-56">
                {children}
            </main>
        </div>
    )
}
