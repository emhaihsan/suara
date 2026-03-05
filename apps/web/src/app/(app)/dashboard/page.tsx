import React from "react"
import Link from "next/link"
import { ArrowRight, AudioLines, Library, Mic } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
    return (
        <div className="p-8 pb-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome to Suara TTS Platform.</p>
                </div>
                <Button asChild>
                    <Link href="/tts">
                        <AudioLines className="mr-2 size-4" />
                        Text to Speech
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Voice Library */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Voice Library</CardTitle>
                        <Library className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">Built-in high quality voices</p>
                        <Button variant="link" className="mt-4 h-auto p-0 text-xs" asChild>
                            <Link href="/library">
                                Browse library <ArrowRight className="ml-1 size-3" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* My Voices */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Voices</CardTitle>
                        <Mic className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Custom cloned voices</p>
                        <Button variant="link" className="mt-4 h-auto p-0 text-xs" asChild>
                            <Link href="/voices">
                                Manage voices <ArrowRight className="ml-1 size-3" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* TTS Jobs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Generations</CardTitle>
                        <AudioLines className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Total TTS generations</p>
                        <Button variant="link" className="mt-4 h-auto p-0 text-xs" asChild>
                            <Link href="/history">
                                View history <ArrowRight className="ml-1 size-3" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
