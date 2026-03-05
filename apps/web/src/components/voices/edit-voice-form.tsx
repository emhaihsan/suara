"use client"

import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface EditVoiceFormProps {
    voice: {
        id: string
        name: string
        description?: string
        category: string
        language: string
        gender: string
        accent?: string
        is_public: boolean
    }
    onUpdate: () => void
}

export function EditVoiceForm({ voice, onUpdate }: EditVoiceFormProps) {
    const { accessToken } = useAuth()

    const [name, setName] = useState(voice.name)
    const [description, setDescription] = useState(voice.description || "")
    const [category, setCategory] = useState(voice.category)
    const [language, setLanguage] = useState(voice.language)
    const [gender, setGender] = useState(voice.gender)
    const [accent, setAccent] = useState(voice.accent || "")
    const [isPublic, setIsPublic] = useState(voice.is_public)

    const [isLoading, setIsLoading] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Reset state when voice prop changes
        setName(voice.name)
        setDescription(voice.description || "")
        setCategory(voice.category)
        setLanguage(voice.language)
        setGender(voice.gender)
        setAccent(voice.accent || "")
        setIsPublic(voice.is_public)
    }, [voice])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setIsSaved(false)

        const response = await api(
            `/voices/${voice.id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    name,
                    description,
                    category,
                    language,
                    gender,
                    accent,
                    is_public: isPublic,
                }),
            },
            accessToken || undefined
        )

        if (response.success) {
            setIsSaved(true)
            onUpdate()
            setTimeout(() => setIsSaved(false), 3000)
        } else {
            setError(response.error?.message || "Failed to edit voice")
        }

        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-card border border-border/50 rounded-xl p-6">
            <div className="mb-2 border-b border-border/50 pb-4">
                <h3 className="text-lg font-medium">Voice Settings</h3>
                <p className="text-sm text-muted-foreground">Modify the fundamental attributes of this voice.</p>
            </div>

            {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="edit-name">Voice Name *</Label>
                <Input
                    id="edit-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cloned">Cloned</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-accent">Accent</Label>
                    <Input
                        id="edit-accent"
                        value={accent}
                        onChange={(e) => setAccent(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 bg-muted/20">
                <div className="space-y-0.5">
                    <Label className="text-base">Make Voice Public</Label>
                    <p className="text-sm text-muted-foreground">
                        Anyone can view and use this voice.
                    </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/50">
                <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaved ? "Saved!" : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
