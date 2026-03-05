"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Square, X, Check, Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import { useAuth } from "@/lib/auth"
import { uploadFile } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

interface VoiceRecorderProps {
    voiceId: string
    onUploaded: (sample: any) => void
}

export function VoiceRecorder({ voiceId, onUploaded }: VoiceRecorderProps) {
    const { accessToken } = useAuth()
    const {
        state,
        audioBlob,
        elapsedMs,
        analyzerNode,
        error,
        startRecording,
        stopRecording,
        discard,
    } = useVoiceRecorder()

    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number | undefined>(undefined)

    // Draw waveform live
    useEffect(() => {
        if (state !== "recording" || !analyzerNode || !canvasRef.current) {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const bufferLength = analyzerNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            requestRef.current = requestAnimationFrame(draw)
            analyzerNode.getByteTimeDomainData(dataArray)

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.lineWidth = 3
            ctx.strokeStyle = "rgb(159, 114, 255)"
            ctx.beginPath()

            const sliceWidth = (canvas.width * 1.0) / bufferLength
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = (v * canvas.height) / 2

                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
                x += sliceWidth
            }

            ctx.lineTo(canvas.width, canvas.height / 2)
            ctx.stroke()
        }

        draw()

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [state, analyzerNode])

    const handleUpload = async () => {
        if (!audioBlob || !accessToken) return
        setIsUploading(true)

        // Ensure it's treated as a file upload with a pseudo filename
        const file = new File([audioBlob], `recording-${Date.now()}.wav`, {
            type: "audio/wav",
        })

        const res = await uploadFile(`/voices/${voiceId}/samples`, file, accessToken)
        if (res.success && res.data) {
            onUploaded(res.data)
            setIsOpen(false)
            discard()
        }

        setIsUploading(false)
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && state === "recording") {
            stopRecording()
        }
        if (!open) {
            discard()
        }
        setIsOpen(open)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Mic className="mr-2 size-4" />
                    Record Live
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Live Recording</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 min-h-[250px] relative">
                    <AnimatePresence mode="wait">
                        {state === "idle" && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <button
                                    onClick={startRecording}
                                    className="group relative flex size-24 items-center justify-center rounded-full bg-primary/10 transition-all hover:bg-primary/20 hover:scale-105"
                                >
                                    <div className="absolute inset-0 rounded-full border-4 border-transparent group-hover:border-primary/30 transition-all"></div>
                                    <Mic className="size-10 text-primary" />
                                </button>
                                <div className="text-center">
                                    <p className="font-semibold text-lg">Click to start</p>
                                    <p className="text-sm text-muted-foreground mt-1 px-4">
                                        Read a clear paragraph of text for the best clone quality.
                                    </p>
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </motion.div>
                        )}

                        {state === "requesting" && (
                            <motion.div
                                key="requesting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-4 text-muted-foreground"
                            >
                                <Loader2 className="size-10 animate-spin text-primary" />
                                <p>Waiting for microphone access...</p>
                            </motion.div>
                        )}

                        {state === "recording" && (
                            <motion.div
                                key="recording"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex w-full flex-col items-center gap-6"
                            >
                                <div className="w-full relative h-32 rounded-xl bg-muted/30 border border-border/50 flex flex-col items-center justify-center overflow-hidden">
                                    <div className="absolute top-3 left-4 flex items-center gap-2">
                                        <span className="relative flex size-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
                                        </span>
                                        <span className="text-sm font-medium tracking-widest text-red-500">REC</span>
                                    </div>

                                    <div className="text-4xl font-mono font-medium opacity-80 mt-2">
                                        {formatTime(elapsedMs)}
                                    </div>

                                    <canvas
                                        ref={canvasRef}
                                        width={300}
                                        height={60}
                                        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80%] opacity-70"
                                    />
                                </div>

                                <Button
                                    variant="destructive"
                                    size="lg"
                                    className="rounded-full size-16 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                    onClick={stopRecording}
                                >
                                    <Square className="size-6 fill-current" />
                                </Button>
                            </motion.div>
                        )}

                        {state === "recorded" && (
                            <motion.div
                                key="recorded"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex w-full flex-col items-center gap-6"
                            >
                                <div className="w-full flex items-center justify-center h-32 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    <div className="flex flex-col items-center">
                                        <Check className="size-10 mb-2" />
                                        <p className="font-semibold text-lg">Recording saved</p>
                                        <p className="text-sm opacity-80">{formatTime(elapsedMs)}</p>
                                    </div>
                                </div>

                                <div className="flex w-full gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={discard}
                                        disabled={isUploading}
                                    >
                                        <RefreshCw className="mr-2 size-4" />
                                        Discard
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        disabled={isUploading || !audioBlob}
                                        onClick={handleUpload}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-2 size-4" />
                                        )}
                                        Use Recording
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
