import React from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
    title: "Sign In | Suara TTS",
}

export default function LoginPage() {
    return (
        <AuthLayout
            title="Sign In"
            subtitle="Welcome back! Please enter your details."
        >
            <LoginForm />
        </AuthLayout>
    )
}
