"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { Search, Globe, Mic, X } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { api, buildQueryString } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { VoiceAvatar } from "@/components/voices/voice-avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface LibraryVoice {
    id: string
    name: string
    description?: string
    category: string
    language: string
    gender: string
    accent?: string
    created_at: string
}

export default function VoiceLibraryPage() {
    const { accessToken } = useAuth()

    const [voices, setVoices] = useState<LibraryVoice[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState("")
    const [language, setLanguage] = useState("all")
    const [gender, setGender] = useState("all")
    const [category, setCategory] = useState("all")

    // Debounce ref
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const fetchLibraryVoices = useCallback(async () => {
        if (!accessToken) return

        setIsLoading(true)
        const query = buildQueryString({
            search: search || undefined,
            language: language !== "all" ? language : undefined,
            gender: gender !== "all" ? gender : undefined,
            category: category !== "all" ? category : undefined,
        })

        const response = await api<{
            data: LibraryVoice[]
            pagination: { total: number; page: number; limit: number; total_pages: number }
        }>(`/voices/library${query}`, undefined, accessToken)

        if (response.success && response.data) {
            setVoices(response.data.data)
        }
        setIsLoading(false)
    }, [search, language, gender, category, accessToken])

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            fetchLibraryVoices()
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [fetchLibraryVoices])


    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Voice Library</h1>
                <p className="text-muted-foreground mt-1">
                    Browse and filter {voices.length > 0 ? voices.length : ""} public voices ready to use.
                </p>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search voices by name..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="w-[130px] bg-background">
                        <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="premade">Premade</SelectItem>
                        <SelectItem value="cloned">Cloned</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border/50 p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            ) : voices.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 mt-8 text-center bg-muted/20">
                    <X className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No voices found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {voices.map((voice) => (
                        <div
                            key={voice.id}
                            className="group flex flex-col justify-between rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30"
                        >
                            <div>
                                <div className="mb-4 flex items-start gap-4">
                                    <VoiceAvatar name={voice.name} size="md" />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-medium leading-tight">{voice.name}</h3>
                                        {voice.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                                {voice.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                                    {voice.category}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] gap-1 group-hover:border-primary/20">
                                    <Globe className="size-3" />
                                    {voice.language}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] gap-1 group-hover:border-primary/20">
                                    <Mic className="size-3" />
                                    {voice.gender}
                                </Badge>
                                {voice.accent && (
                                    <Badge variant="outline" className="text-[10px] border-dashed">
                                        {voice.accent}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
