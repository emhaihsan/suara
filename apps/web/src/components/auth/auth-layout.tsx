import React from "react"
import { Waves } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface AuthLayoutProps {
    title: string
    subtitle: string
    children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen">
            {/* The left form side */}
            <div className="flex flex-1 flex-col justify-center px-6 lg:px-8">
                <div className="absolute right-4 top-4 md:right-8 md:top-8">
                    <ThemeToggle />
                </div>

                <div className="mx-auto w-full max-w-[400px]">
                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                            <Waves className="size-4" />
                        </div>
                        <span className="text-base font-bold tracking-tight">Suara TTS Platform</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    </div>

                    {children}
                </div>
            </div>

            {/* The right visual side (hidden on mobile by default) */}
            <div className="relative hidden flex-1 overflow-hidden bg-zinc-950 dark:block">
                <div className="absolute inset-0 opacity-30 style={{ backgroundImage: 'linear-gradient(to right, #4f4f4f2e 1px, transparent 1px), linear-gradient(to bottom, #4f4f4f2e 1px, transparent 1px)', backgroundSize: '14px 24px' }}" />

                {/* Visual waveform placeholder */}
                <div className="absolute inset-x-0 bottom-0 top-1/4">
                    <div className="flex h-full w-full items-end justify-center opacity-20">
                        {/* Simulated Waveform bars */}
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div
                                key={i}
                                className="mx-[2px] w-4 rounded-t-sm bg-primary"
                                style={{ height: `${Math.max(10, Math.sin(i * 0.3) * 60 + Math.random() * 40)}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-10 left-10 right-10 z-10">
                    <blockquote className="space-y-2">
                        <p className="text-lg text-zinc-300">
                            "A human voice is the most perfect instrument of all. Suara aims to bring that perfection to the digital realm with cutting edge TTS technology."
                        </p>
                    </blockquote>
                </div>
            </div>
        </div>
    )
}
