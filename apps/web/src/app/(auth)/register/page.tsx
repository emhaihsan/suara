import React from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata = {
    title: "Create an Account | Suara TTS",
}

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Create an account"
            subtitle="Enter your information to get started."
        >
            <RegisterForm />
        </AuthLayout>
    )
}
