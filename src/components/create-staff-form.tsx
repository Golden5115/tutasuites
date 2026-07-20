"use client"

import { useActionState } from "react"
import { createStaffAction } from "@/app/actions/staff-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function CreateStaffForm() {
  const [state, formAction, isPending] = useActionState(createStaffAction, undefined)

  return (
    <Card className="max-w-xl">
      <form action={formAction}>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="FRONT_DESK">Front Desk</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label>Accessible Modules</Label>
            <div className="flex flex-col gap-2 rounded-md border p-4">
              {['RESERVATIONS', 'GUESTS', 'ROOMS', 'SETTINGS', 'STAFF'].map(mod => (
                <label key={mod} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="modules" value={mod} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  {mod.charAt(0) + mod.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select the modules this staff member can access.</p>
          </div>

          {state?.error && (
            <div className="text-sm text-red-500 font-medium">
              {state.error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Staff"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
