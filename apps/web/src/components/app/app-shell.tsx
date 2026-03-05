"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Library, Mic, Waves } from "lucide-react"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Voice Library", href: "/library", icon: Library },
    { label: "My Voices", href: "/voices", icon: Mic },
]

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

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
                <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
                    <span className="text-xs text-muted-foreground">Appearance</span>
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 pl-56">
                {children}
            </main>
        </div>
    )
}
