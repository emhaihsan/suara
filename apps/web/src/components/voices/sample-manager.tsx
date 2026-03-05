"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { FileAudio, UploadCloud, Trash2, Loader2, DownloadCloud } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { api, uploadFile } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { VoiceRecorder } from "@/components/voices/voice-recorder"

interface VoiceSample {
    id: string
    voice_id: string
    file_name: string
    mime_type: string
    size_bytes: number
    duration_seconds?: number
    storage_path: string
    created_at: string
}

interface SampleManagerProps {
    voiceId: string
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " Bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
}

export function SampleManager({ voiceId }: SampleManagerProps) {
    const { accessToken } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [samples, setSamples] = useState<VoiceSample[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchSamples = useCallback(async () => {
        if (!accessToken) return
        setIsLoading(true)
        const res = await api<VoiceSample[]>(`/voices/${voiceId}/samples`, undefined, accessToken)
        if (res.success && res.data) {
            setSamples(res.data)
        }
        setIsLoading(false)
    }, [voiceId, accessToken])

    useEffect(() => {
        fetchSamples()
    }, [fetchSamples])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !accessToken) return

        setIsUploading(true)
        const res = await uploadFile<VoiceSample>(`/voices/${voiceId}/samples`, file, accessToken)

        if (res.success && res.data) {
            setSamples((prev) => [res.data as VoiceSample, ...prev])
        }

        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleDelete = async (sampleId: string) => {
        if (!accessToken) return
        setDeletingId(sampleId)
        const res = await api(`/voices/${voiceId}/samples/${sampleId}`, { method: "DELETE" }, accessToken)

        if (res.success) {
            setSamples((prev) => prev.filter((s) => s.id !== sampleId))
        }
        setDeletingId(null)
    }

    const handleGetLink = async (sampleId: string) => {
        if (!accessToken) return
        const res = await api<{ download_url: string }>(
            `/voices/${voiceId}/samples/${sampleId}`,
            undefined,
            accessToken
        )
        if (res.success && res.data) {
            window.open(res.data.download_url, "_blank")
        }
    }

    return (
        <div className="space-y-6 max-w-2xl bg-card border border-border/50 rounded-xl p-6">
            <div className="border-b border-border/50 pb-4">
                <h3 className="text-lg font-medium">Audio Samples</h3>
                <p className="text-sm text-muted-foreground">Upload or record audio samples to train this voice clone.</p>
            </div>

            {/* Upload Area */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/10 p-8 text-center transition-colors hover:bg-muted/30">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <UploadCloud className="size-6" />
                </div>
                <h4 className="text-sm font-semibold mb-1">Upload an audio file</h4>
                <p className="text-xs text-muted-foreground mb-4">WAV, MP3, FLAC, OGG up to 10MB</p>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept="audio/*"
                    className="hidden"
                />

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Choose File
                    </Button>
                    <VoiceRecorder voiceId={voiceId} onUploaded={(s) => setSamples([s, ...samples])} />
                </div>
            </div>

            {/* Samples List */}
            <div className="mt-8">
                <h4 className="mb-4 text-sm font-medium">Uploaded Samples ({samples.length})</h4>

                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-md" />
                        <Skeleton className="h-16 w-full rounded-md" />
                    </div>
                ) : samples.length === 0 ? (
                    <div className="rounded-md border border-border/30 p-6 text-center text-sm text-muted-foreground bg-muted/5">
                        No samples yet. Upload a file or start recording.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {samples.map((sample) => (
                            <div
                                key={sample.id}
                                className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-3 hover:border-primary/30 transition-colors"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                        <FileAudio className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{sample.file_name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{formatBytes(sample.size_bytes)}</span>
                                            <span>•</span>
                                            <span>{sample.mime_type}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 ml-4 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-muted-foreground hover:text-primary"
                                        onClick={() => handleGetLink(sample.id)}
                                        title="Download"
                                    >
                                        <DownloadCloud className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={deletingId === sample.id}
                                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDelete(sample.id)}
                                        title="Delete"
                                    >
                                        {deletingId === sample.id ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
