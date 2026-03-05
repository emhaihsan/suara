"use client"

import React, { useState } from "react"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

export interface CreateVoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (voiceId: string) => void
}

export function CreateVoiceDialog({
    open,
    onOpenChange,
    onCreated,
}: CreateVoiceDialogProps) {
    const { accessToken } = useAuth()

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("custom")
    const [language, setLanguage] = useState("English")
    const [gender, setGender] = useState("Male")
    const [accent, setAccent] = useState("")
    const [isPublic, setIsPublic] = useState(false)

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const reset = () => {
        setName("")
        setDescription("")
        setCategory("custom")
        setLanguage("English")
        setGender("Male")
        setAccent("")
        setIsPublic(false)
        setError(null)
    }

    const handleOpenChange = (val: boolean) => {
        if (!val) reset()
        onOpenChange(val)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const response = await api<{ id: string }>(
            "/voices",
            {
                method: "POST",
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

        if (response.success && response.data) {
            onCreated(response.data.id)
            handleOpenChange(false)
        } else {
            setError(response.error?.message || "Failed to create voice")
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Voice</DialogTitle>
                    <DialogDescription>
                        Add a new voice to your studio collection.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Voice Name *</Label>
                        <Input
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My Custom Voice"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the voice's characteristics..."
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <Label htmlFor="accent">Accent</Label>
                            <Input
                                id="accent"
                                value={accent}
                                onChange={(e) => setAccent(e.target.value)}
                                placeholder="e.g. British, American"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 mt-4 bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Make Voice Public</Label>
                            <p className="text-xs text-muted-foreground">
                                Anyone can view and use this voice
                            </p>
                        </div>
                        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Voice
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
