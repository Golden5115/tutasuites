import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Settings, Percent, DollarSign, Shirt, List, Wine, Utensils } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

async function updateSettings(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  const taxPercent = parseFloat(formData.get("taxPercent") as string) || 0
  const servicePercent = parseFloat(formData.get("servicePercent") as string) || 0
  const currencySymbol = (formData.get("currencySymbol") as string) || "₦"
  const hotelName = (formData.get("hotelName") as string) || "Tuta Suites"
  const hotelAddress = formData.get("hotelAddress") as string
  const hotelPhone = formData.get("hotelPhone") as string
  const hotelEmail = formData.get("hotelEmail") as string

  await prisma.siteSettings.update({
    where: { id },
    data: { taxPercent, servicePercent, currencySymbol, hotelName, hotelAddress, hotelPhone, hotelEmail },
  })

  revalidatePath("/dashboard/settings")
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

  let settings = await prisma.siteSettings.findFirst()
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: {} })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Site Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure pricing, tax, service charges, and hotel information.
        </p>
      </div>

      <form action={updateSettings} key={settings.updatedAt?.getTime()}>
        <input type="hidden" name="id" value={settings.id} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" /> Pricing & Charges
              </CardTitle>
              <CardDescription>Set the tax and service charge percentages applied to bookings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="taxPercent">Tax Percentage (%)</Label>
                <Input
                  id="taxPercent"
                  name="taxPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={settings.taxPercent}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="servicePercent">Service Charge (%)</Label>
                <Input
                  id="servicePercent"
                  name="servicePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={settings.servicePercent}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  name="currencySymbol"
                  defaultValue={settings.currencySymbol}
                />
              </div>
            </CardContent>
          </Card>

          {/* Hotel Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Hotel Information
              </CardTitle>
              <CardDescription>Hotel details shown on booking confirmations and receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="hotelName">Hotel Name</Label>
                <Input id="hotelName" name="hotelName" defaultValue={settings.hotelName} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hotelAddress">Address</Label>
                <Input id="hotelAddress" name="hotelAddress" defaultValue={settings.hotelAddress || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hotelPhone">Phone</Label>
                <Input id="hotelPhone" name="hotelPhone" defaultValue={settings.hotelPhone || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hotelEmail">Email</Label>
                <Input id="hotelEmail" name="hotelEmail" type="email" defaultValue={settings.hotelEmail || ""} />
              </div>
            </CardContent>
          </Card>

          {/* Laundry Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-primary" /> Laundry Pricing
              </CardTitle>
              <CardDescription>Manage fixed prices for dry cleaning services.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/laundry-catalog" className="w-full">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Manage Price Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button type="submit" size="lg">
            Save Settings
          </Button>
          {/* Bar Pricing */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-primary" /> Mini Lounge Catalog
              </CardTitle>
              <CardDescription>Manage drink inventory, prices, and categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/bar-catalog" className="w-full">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <List className="w-4 h-4" /> Manage Bar Items
                </Button>
              </Link>
            </CardContent>
          </Card>
          {/* Restaurant Pricing */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" /> Restaurant Menu
              </CardTitle>
              <CardDescription>Manage food inventory, prices, and categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/restaurant-catalog" className="w-full">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <List className="w-4 h-4" /> Manage Restaurant Items
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
