"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { encodeWAV } from "@/lib/wave-encoder"

export type RecorderState = "idle" | "requesting" | "recording" | "recorded"

export interface UseVoiceRecorderReturn {
    state: RecorderState
    audioBlob: Blob | null
    elapsedMs: number
    analyzerNode: AnalyserNode | null
    error: string | null
    startRecording: () => Promise<void>
    stopRecording: () => void
    discard: () => void
}

const MAX_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export function useVoiceRecorder(): UseVoiceRecorderReturn {
    const [state, setState] = useState<RecorderState>("idle")
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [elapsedMs, setElapsedMs] = useState(0)
    const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const maxTimerRef = useRef<NodeJS.Timeout | null>(null)
    const startTimeRef = useRef(0)

    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (maxTimerRef.current) clearTimeout(maxTimerRef.current)

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error)
            audioContextRef.current = null
        }

        setAnalyzerNode(null)
        chunksRef.current = []
    }, [])

    useEffect(() => {
        return cleanup
    }, [cleanup])

    const startRecording = useCallback(async () => {
        setError(null)
        setState("requesting")

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            })
            streamRef.current = stream

            // Set up AudioContext for analysis
            const ctx = new AudioContext()
            audioContextRef.current = ctx
            const source = ctx.createMediaStreamSource(stream)
            const analyzer = ctx.createAnalyser()
            analyzer.fftSize = 256
            source.connect(analyzer)
            setAnalyzerNode(analyzer)

            // Choose mime type
            const mimeTypes = ["audio/webm", "audio/mp4", "audio/ogg"]
            let selectedMimeType = ""
            for (const t of mimeTypes) {
                if (MediaRecorder.isTypeSupported(t)) {
                    selectedMimeType = t
                    break
                }
            }

            const recorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType || undefined,
            })
            mediaRecorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = async () => {
                try {
                    const rawBlob = new Blob(chunksRef.current, { type: recorder.mimeType })
                    // Decode to PCM to re-encode to clean WAV 16-bit
                    const arrayBuffer = await rawBlob.arrayBuffer()
                    const ctxBuffer = await ctx.decodeAudioData(arrayBuffer)

                    // Mix down to mono
                    let monoSamples: Float32Array
                    if (ctxBuffer.numberOfChannels === 1) {
                        monoSamples = ctxBuffer.getChannelData(0)
                    } else {
                        const l = ctxBuffer.getChannelData(0)
                        const r = ctxBuffer.getChannelData(1)
                        monoSamples = new Float32Array(ctxBuffer.length)
                        for (let i = 0; i < ctxBuffer.length; i++) {
                            monoSamples[i] = (l[i] + r[i]) / 2
                        }
                    }

                    const wavBlob = encodeWAV(monoSamples, ctxBuffer.sampleRate)
                    setAudioBlob(wavBlob)
                    setState("recorded")
                } catch (err) {
                    setError("Failed to decode and save recording.")
                    setState("idle")
                }
            }

            recorder.start(250) // collect chunks every 250ms
            startTimeRef.current = Date.now()
            setState("recording")

            timerRef.current = setInterval(() => {
                setElapsedMs(Date.now() - startTimeRef.current)
            }, 100)

            maxTimerRef.current = setTimeout(() => {
                stopRecording()
            }, MAX_DURATION_MS)

        } catch (err) {
            cleanup()
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setError("Microphone access was denied. Please allow it in settings.")
            } else {
                setError("No microphone found or another device error occurred.")
            }
            setState("idle")
        }
    }, [cleanup])

    const stopRecording = useCallback(() => {
        if (state !== "recording") return

        if (timerRef.current) clearInterval(timerRef.current)
        if (maxTimerRef.current) clearTimeout(maxTimerRef.current)

        setElapsedMs(Date.now() - startTimeRef.current)

        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
        }

        // Cleanup stream early so icon disappears
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }

        setAnalyzerNode(null)
    }, [state])

    const discard = useCallback(() => {
        cleanup()
        setAudioBlob(null)
        setElapsedMs(0)
        setError(null)
        setState("idle")
    }, [cleanup])

    return {
        state,
        audioBlob,
        elapsedMs,
        analyzerNode,
        error,
        startRecording,
        stopRecording,
        discard,
    }
}
