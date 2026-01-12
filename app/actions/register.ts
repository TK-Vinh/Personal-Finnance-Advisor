"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
})

export async function registerUser(data: {
    name: string
    email: string
    password: string
}) {
    try {
        // Validate input
        const validatedData = registerSchema.parse(data)

        // Connect to MongoDB
        await dbConnect()

        // Check if user already exists
        const existingUser = await User.findOne({
            email: validatedData.email,
        })

        if (existingUser) {
            return {
                success: false,
                error: "An account with this email already exists",
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10)

        // Create user
        await User.create({
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
        })

        return {
            success: true,
            message: "Account created successfully! You can now sign in.",
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0].message,
            }
        }

        console.error("Registration error:", error)
        return {
            success: false,
            error: "An error occurred during registration. Please try again.",
        }
    }
}
