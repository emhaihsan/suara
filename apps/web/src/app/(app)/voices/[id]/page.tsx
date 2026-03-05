"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Globe, Mic, Trash2 } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

import { VoiceAvatar } from "@/components/voices/voice-avatar"
import { EditVoiceForm } from "@/components/voices/edit-voice-form"
import { SampleManager } from "@/components/voices/sample-manager"

interface Voice {
    id: string
    name: string
    description?: string
    category: string
    language: string
    gender: string
    accent?: string
    is_public: boolean
    created_at: string
}

export default function VoiceDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { accessToken } = useAuth()
    const voiceId = id as string

    const [voice, setVoice] = useState<Voice | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchVoice = useCallback(async () => {
        if (!accessToken) return
        setIsLoading(true)
        const res = await api<Voice>(`/voices/${voiceId}`, undefined, accessToken)
        if (res.success && res.data) {
            setVoice(res.data)
        }
        setIsLoading(false)
    }, [voiceId, accessToken])

    useEffect(() => {
        fetchVoice()
    }, [fetchVoice])

    const handleDelete = async () => {
        if (!accessToken) return
        setIsDeleting(true)
        const res = await api(`/voices/${voiceId}`, { method: "DELETE" }, accessToken)
        if (res.success) {
            router.push("/voices")
        }
        setIsDeleting(false)
    }

    if (isLoading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    if (!voice) {
        return (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center p-8 text-center">
                <h2 className="mb-2 text-2xl font-bold">Voice not found</h2>
                <p className="mb-6 text-muted-foreground">The voice you are looking for does not exist or you don't have access.</p>
                <Button onClick={() => router.push("/voices")}>Back to My Voices</Button>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" className="mb-6 -ml-4" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 size-4" />
                Back
            </Button>

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                    <VoiceAvatar name={voice.name} size="xl" className="shadow-lg" />
                    <div className="mt-1">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{voice.name}</h1>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="uppercase text-xs">{voice.category}</Badge>
                            <Badge variant="outline" className="gap-1.5 opacity-80">
                                <Globe className="size-3" /> {voice.language}
                            </Badge>
                            <Badge variant="outline" className="gap-1.5 opacity-80">
                                <Mic className="size-3" /> {voice.gender}
                            </Badge>
                            {voice.accent && (
                                <Badge variant="outline" className="border-dashed opacity-80">{voice.accent}</Badge>
                            )}
                            {voice.is_public && (
                                <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Public</Badge>
                            )}
                        </div>
                    </div>
                </div>

                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-2 size-4" />
                    Delete Voice
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="settings" className="mt-10">
                <TabsList className="mb-6 border-b border-border/50 w-full justify-start rounded-none h-12 bg-transparent p-0">
                    <TabsTrigger
                        value="settings"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 h-full"
                    >
                        Settings
                    </TabsTrigger>
                    <TabsTrigger
                        value="samples"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 h-full"
                    >
                        Audio Samples
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-0">
                    <EditVoiceForm voice={voice} onUpdate={fetchVoice} />
                </TabsContent>

                <TabsContent value="samples" className="mt-0">
                    <SampleManager voiceId={voiceId} />
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your voice profile
                            and remove your audio samples from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                            {isDeleting ? "Deleting..." : "Permanently Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
