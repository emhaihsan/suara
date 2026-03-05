"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mic, Plus, Settings } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { VoiceAvatar } from "@/components/voices/voice-avatar"
import { CreateVoiceDialog } from "@/components/voices/create-voice-dialog"

interface Voice {
    id: string
    name: string
    description?: string
    category: string
    language: string
    gender: string
    accent?: string
    is_public: boolean
}

export default function MyVoicesPage() {
    const { accessToken } = useAuth()
    const router = useRouter()

    const [voices, setVoices] = useState<Voice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    const fetchVoices = useCallback(async () => {
        if (!accessToken) return
        setIsLoading(true)

        const response = await api<Voice[]>("/voices", undefined, accessToken)
        if (response.success && response.data) {
            setVoices(response.data)
        }
        setIsLoading(false)
    }, [accessToken])

    useEffect(() => {
        fetchVoices()
    }, [fetchVoices])

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Voices</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your cloned and custom created voices.
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 size-4" />
                    Create Voice
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            ) : voices.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-24 text-center bg-muted/10">
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <Mic className="size-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No custom voices found</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Create your very first voice clone or custom synthesis profile. Connect an audio sample to train.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 size-4" />
                        Create Your First Voice
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {voices.map((voice) => (
                        <button
                            key={voice.id}
                            onClick={() => router.push(`/voices/${voice.id}`)}
                            className="group flex w-full items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm text-left"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <VoiceAvatar name={voice.name} />
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-lg leading-none truncate mb-1.5 flex items-center gap-2">
                                        {voice.name}
                                        {!voice.is_public && (
                                            <Badge variant="secondary" className="text-[9px] uppercase h-4 px-1">Private</Badge>
                                        )}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="capitalize">{voice.category}</span>
                                        <span className="opacity-50">•</span>
                                        <span>{voice.language}</span>
                                        <span className="opacity-50">•</span>
                                        <span>{voice.gender}</span>
                                        {voice.accent && (
                                            <>
                                                <span className="opacity-50">•</span>
                                                <span>{voice.accent}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
                                <Button variant="ghost" size="icon" className="size-8">
                                    <Settings className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <CreateVoiceDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onCreated={(id) => router.push(`/voices/${id}`)}
            />
        </div>
    )
}
