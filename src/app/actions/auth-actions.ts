"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      if ((error as any).cause?.err?.message === "AccountDeactivated" || (error as any).message?.includes("AccountDeactivated")) {
        return { error: "This staff account has been deactivated. Please contact an administrator." }
      }
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials or account is suspended." }
        default:
          return { error: "Something went wrong." }
      }
    }
    const errStr = String(error)
    if (errStr.includes("AccountDeactivated")) {
      return { error: "This staff account has been deactivated. Please contact an administrator." }
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut()
}
