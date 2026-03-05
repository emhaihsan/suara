"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Library, Mic, Waves } from "lucide-react"

export default function DashboardPage() {
    const { user } = useAuth()

    const quickActions = [
        {
            title: "Voice Library",
            description: "Browse and preview our collection of public voices.",
            href: "/voices/library",
            icon: Library,
        },
        {
            title: "My Voices",
            description: "Create and manage your own custom cloned voices.",
            href: "/voices",
            icon: Mic,
        },
        {
            title: "TTS Studio",
            description: "Synthesize text using the voices available to you.",
            href: "/tts",
            icon: Waves,
        },
    ]

    return (
        <div className="p-8">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-8 py-10 mb-10 shadow-sm">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {user?.name?.split(" ")[0] || "User"}!
                    </h1>
                    <p className="mt-2 max-w-md text-muted-foreground">
                        Generate lifelike speech, clone voices, and craft immersive audio experiences with the Suara platform.
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-10 -top-24 opacity-10 blur-3xl pointer-events-none">
                    <div className="size-96 rounded-full bg-primary" />
                </div>
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 dark:opacity-40 flex items-end">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="mx-1 w-6 rounded-t-sm bg-primary"
                            style={{
                                height: `${Math.max(20, Math.sin(i * 0.5) * 80 + Math.random() * 40)}px`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <h2 className="mb-4 text-xl font-semibold tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => (
                    <Link
                        key={action.title}
                        href={action.href}
                        className="group block rounded-lg border border-border/50 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
                    >
                        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <action.icon className="size-6 transition-transform group-hover:scale-110" />
                        </div>
                        <h3 className="mb-2 font-medium">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
