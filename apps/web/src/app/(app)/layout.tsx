"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { AppShell } from "@/components/app/app-shell"

function ProtectedGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login")
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedGuard>
            <AppShell>{children}</AppShell>
        </ProtectedGuard>
    )
}
