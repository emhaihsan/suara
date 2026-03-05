"use client"

import React, { useState, useEffect, useRef } from "react"
import { Play, Square, Loader2, Info, FileAudio } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { VoiceAvatar } from "@/components/voices/voice-avatar"

interface Voice {
    id: string
    name: string
    category: string
    is_public: boolean
}

interface TTSJob {
    id: string
    voice_id: string
    status: "pending" | "processing" | "completed" | "failed"
    text_content: string
    audio_url?: string
}

export default function TTSStudioPage() {
    const { accessToken } = useAuth()

    // State
    const [voices, setVoices] = useState<Voice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<string>("")
    const [text, setText] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Current job for polling
    const [currentJob, setCurrentJob] = useState<TTSJob | null>(null)

    // Audio playback
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch available voices (public + private)
    useEffect(() => {
        const fetchVoices = async () => {
            if (!accessToken) return

            // Fetch public list
            const publicRes = await api<{ data: Voice[] }>("/voices/library?limit=100", undefined, accessToken)
            // Fetch private list
            const privateRes = await api<Voice[]>("/voices", undefined, accessToken)

            const mergedMap = new Map<string, Voice>()
            if (publicRes.success && publicRes.data?.data) {
                publicRes.data.data.forEach((v) => mergedMap.set(v.id, v))
            }
            if (privateRes.success && privateRes.data) {
                privateRes.data.forEach((v) => mergedMap.set(v.id, v))
            }

            setVoices(Array.from(mergedMap.values()))
        }

        fetchVoices()
    }, [accessToken])

    // Cleanup polling
    useEffect(() => {
        return () => {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
        }
    }, [])

    const pollJobStatus = async (jobId: string) => {
        if (!accessToken) return

        const res = await api<TTSJob>(`/tts/${jobId}`, undefined, accessToken)
        if (res.success && res.data) {
            setCurrentJob(res.data)

            if (res.data.status === "completed" || res.data.status === "failed") {
                setIsGenerating(false)
                if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)

                if (res.data.status === "failed") {
                    setError("TTS Generation failed. Worker might be down.")
                } else if (res.data.status === "completed" && res.data.audio_url) {
                    // Play automatically
                    if (audioRef.current) {
                        audioRef.current.src = res.data.audio_url
                        audioRef.current.load()
                    }
                }
            }
        }
    }

    const handleGenerate = async () => {
        if (!accessToken || !selectedVoice || !text.trim()) return

        setIsGenerating(true)
        setError(null)
        setCurrentJob(null)

        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }

        const res = await api<{ job_id: string }>(
            "/tts",
            {
                method: "POST",
                body: JSON.stringify({
                    text: text.trim(),
                    voice_id: selectedVoice,
                }),
            },
            accessToken
        )

        if (res.success && res.data) {
            const jobId = res.data.job_id

            // Initial local state update
            setCurrentJob({
                id: jobId,
                voice_id: selectedVoice,
                status: "pending",
                text_content: text.trim(),
            })

            // Start polling every 2 seconds
            pollingTimerRef.current = setInterval(() => {
                pollJobStatus(jobId)
            }, 2000)
        } else {
            setError(res.error?.message || "Failed to submit TTS job")
            setIsGenerating(false)
        }
    }

    const togglePlayback = () => {
        if (!audioRef.current || !currentJob?.audio_url) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(console.error)
        }
    }

    const selectedVoiceObj = voices.find(v => v.id === selectedVoice)

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">TTS Studio</h1>
                <p className="text-muted-foreground mt-1">
                    Synthesize text to speech using RabbitMQ async processing.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                {/* Left Column: Input Controls */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Voice</label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                            <SelectTrigger className="h-14">
                                <SelectValue placeholder="Choose a voice for synthesis..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {voices.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                        <div className="flex items-center gap-3">
                                            <VoiceAvatar name={v.name} size="xs" />
                                            <span className="font-medium">{v.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2 capitalize">
                                                ({v.category})
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Text Content</label>
                            <span className="text-xs text-muted-foreground">{text.length} / 500</span>
                        </div>
                        <Textarea
                            placeholder="Hi there! I am a synthesized voice from the Suara platform. It's great to meet you."
                            className="flex-1 min-h-[300px] resize-none text-base p-4"
                            value={text}
                            onChange={(e) => setText(e.target.value.slice(0, 500))}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Info className="size-4 mr-1.5" />
                            Processing is simulated if Kokoro is unavailable.
                        </div>
                        <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={!selectedVoice || !text.trim() || isGenerating}
                            className="min-w-[140px]"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Generate Audio"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right Column: Output / Player */}
                <div className="bg-card border border-border/50 rounded-xl p-6 flex flex-col h-[400px] lg:h-auto">
                    <h3 className="font-medium border-b border-border/50 pb-4 mb-4 flex items-center gap-2">
                        <FileAudio className="size-4 text-primary" />
                        Job Output
                    </h3>

                    <div className="flex-1 flex flex-col justify-center items-center">
                        {error ? (
                            <div className="text-center text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
                                {error}
                            </div>
                        ) : !currentJob ? (
                            <div className="text-center text-muted-foreground">
                                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                    <Play className="size-6 opacity-20" />
                                </div>
                                <p className="text-sm">Synthesize text to view the output here.</p>
                            </div>
                        ) : currentJob.status === "pending" || currentJob.status === "processing" ? (
                            <div className="text-center flex flex-col items-center">
                                <div className="relative size-20 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="size-6 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <h4 className="font-medium tracking-wide animate-pulse">
                                    {currentJob.status === "pending" ? "Job Queued..." : "Worker Processing..."}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                                    Waiting for the RabbitMQ consumer to finish TTS encoding.
                                </p>
                            </div>
                        ) : currentJob.status === "completed" && currentJob.audio_url ? (
                            <div className="w-full flex flex-col items-center">
                                <div className="size-24 rounded-full bg-primary/10 flex flex-col items-center justify-center shadow-inner mb-6 relative">
                                    {selectedVoiceObj ? (
                                        <VoiceAvatar name={selectedVoiceObj.name} size="lg" className="absolute" />
                                    ) : null}
                                    <div className="absolute -bottom-2 -right-2 size-8 bg-green-500 rounded-full border border-background flex items-center justify-center text-white">
                                        <Check className="size-4" />
                                    </div>
                                </div>

                                <div className="bg-muted w-full rounded-2xl h-16 flex items-center px-4 mb-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-10 rounded-full bg-background shadow-sm shrink-0 mr-4"
                                        onClick={togglePlayback}
                                    >
                                        {isPlaying ? <Square className="size-4" fill="currentColor" /> : <Play className="size-4 ml-1" fill="currentColor" />}
                                    </Button>
                                    <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-full origin-left placeholder-wave"></div>
                                    </div>
                                </div>

                                <a
                                    href={currentJob.audio_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
                                >
                                    Download Audio ↗
                                </a>

                                {/* Hidden Audio Element */}
                                <audio
                                    ref={audioRef}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
