"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface VoiceAvatarProps {
    name: string
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    className?: string
}

const colorPalettes = [
    ["#FF9A9E", "#FECFEF"],
    ["#a18cd1", "#fbc2eb"],
    ["#84fab0", "#8fd3f4"],
    ["#fccb90", "#d57eeb"],
    ["#e0c3fc", "#8ec5fc"],
    ["#f093fb", "#f5576c"],
    ["#4facfe", "#00f2fe"],
    ["#fa709a", "#fee140"],
    ["#667eea", "#764ba2"],
    ["#89f7fe", "#66a6ff"],
    ["#30cfd0", "#330867"],
]

// Simple hash function to always pick the same colors for the same string
function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash)
}

const sizeClasses = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-12 text-sm",
    lg: "size-16 text-xl",
    xl: "size-24 text-3xl",
}

export function VoiceAvatar({ name, size = "md", className }: VoiceAvatarProps) {
    const hash = hashString(name)
    const paletteIndex = hash % colorPalettes.length
    const [color1, color2] = colorPalettes[paletteIndex]

    // Use the letter "A" if name is empty, otherwise grab first initial
    const initial = (name ? name.charAt(0) : "A").toUpperCase()

    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ring-1 ring-border",
                sizeClasses[size],
                className
            )}
            style={{
                background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
            }}
        >
            {initial}
        </div>
    )
}
