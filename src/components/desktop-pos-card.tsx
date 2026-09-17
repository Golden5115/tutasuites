"use client"

import { useState, useEffect } from "react"
import { Printer, Download, CheckCircle2, Monitor, RefreshCw, Sparkles, HardDrive } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PrinterInfo {
  name: string
  displayName: string
  status: number
  isDefault: boolean
  isSelected?: boolean
}

export function DesktopPosCard() {
  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [testPrintStatus, setTestPrintStatus] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.isDesktop) {
      setIsDesktop(true)
      loadPrinters()
    }
  }, [])

  const loadPrinters = async () => {
    if (typeof window === "undefined" || !(window as any).electronAPI) return
    setLoading(true)
    try {
      const list = await (window as any).electronAPI.getPrinters()
      const config = await (window as any).electronAPI.getConfig()
      setPrinters(list || [])

      if (config?.selectedPrinter) {
        setSelectedPrinter(config.selectedPrinter)
      } else {
        // Auto-select Xprinter if detected
        const xprinter = list.find((p: PrinterInfo) =>
          /xprinter|xp-|pos|thermal|receipt/i.test(p.name)
        )
        if (xprinter) {
          setSelectedPrinter(xprinter.name)
        } else {
          const defaultP = list.find((p: PrinterInfo) => p.isDefault)
          if (defaultP) setSelectedPrinter(defaultP.name)
        }
      }
    } catch (err) {
      console.error("Failed to load printers:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPrinter = async (printerName: string) => {
    setSelectedPrinter(printerName)
    if ((window as any).electronAPI?.saveConfig) {
      await (window as any).electronAPI.saveConfig({ selectedPrinter: printerName })
    }
  }

  const handleTestPrint = async () => {
    if (!isDesktop || !(window as any).electronAPI) return
    setLoading(true)
    setTestPrintStatus("Printing test receipt...")

    const escposTest = [
      '\x1B@',
      '\x1Ba\x01',
      '\x1B!\x30',
      'TUTA SUITES\n',
      '\x1B!\x00',
      'DIRECT POS HARDWARE TEST\n',
      'No QZ Tray - Pure Native Spooler\n',
      '------------------------------------------\n',
      '\x1Ba\x00',
      `Printer: ${selectedPrinter || 'Xprinter (Auto-detected)'}\n`,
      `Date: ${new Date().toLocaleString()}\n`,
      'Status: Connected & Operational OK\n',
      '------------------------------------------\n',
      '\x1Ba\x01',
      '\x1BE\x01',
      'TEST PRINT SUCCESSFUL!\n',
      '\x1BE\x00',
      'Tuta Suites Desktop Terminal\n\n\n\n',
      '\x1DV\x41\x03'
    ].join('')

    try {
      const res = await (window as any).electronAPI.printRaw(escposTest, selectedPrinter)
      if (res?.success) {
        setTestPrintStatus(`Printed successfully to ${res.printer || selectedPrinter}`)
      } else {
        setTestPrintStatus(`Print error: ${res?.error || "Unknown error"}`)
      }
    } catch (err: any) {
      setTestPrintStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setTestPrintStatus(null), 5000)
    }
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-500" />
            POS Desktop Hardware & Xprinter
          </CardTitle>
          {isDesktop ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Desktop Client Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
              Web Browser Mode
            </span>
          )}
        </div>
        <CardDescription>
          {isDesktop
            ? "You are running Tuta Suites in native desktop mode. Direct silent printing to your Xprinter is fully active without QZ Tray."
            : "Install the standalone Windows software for 1-click silent thermal printing to your POS Xprinter without browser pop-ups or QZ Tray."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isDesktop ? (
          // DESKTOP ENVIRONMENT CONTROLS
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background/60 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-500" />
                  Thermal Printer Configuration
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadPrinters}
                  disabled={loading}
                  className="h-8 text-xs gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {printers.length > 0 ? (
                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Select Xprinter / Receipt Printer:</label>
                  <select
                    value={selectedPrinter}
                    onChange={(e) => handleSelectPrinter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Auto-Detect (Xprinter / POS-80)</option>
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.isDefault ? "★ (System Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2">
                  Scanning for installed printers...
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Silent Printing Active (Zero Dialogs)
                </div>
                <Button
                  size="sm"
                  onClick={handleTestPrint}
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-8 text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Test Print (80mm)
                </Button>
              </div>

              {testPrintStatus && (
                <div className="text-xs p-2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  {testPrintStatus}
                </div>
              )}
            </div>
          </div>
        ) : (
          // WEB ENVIRONMENT DOWNLOAD CARD
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-background/50 space-y-1">
                <div className="text-xs font-semibold flex items-center gap-1 text-amber-500">
                  <Sparkles className="w-3.5 h-3.5" /> Direct Silent Print
                </div>
                <p className="text-xs text-muted-foreground">
                  Receipts print immediately when you click Print. No browser pop-ups.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-background/50 space-y-1">
                <div className="text-xs font-semibold flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No QZ Tray Needed
                </div>
                <p className="text-xs text-muted-foreground">
                  No Java runtime, no websocket server, and no certificate warnings.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-background/50 space-y-1">
                <div className="text-xs font-semibold flex items-center gap-1 text-blue-500">
                  <HardDrive className="w-3.5 h-3.5" /> Auto-Sync Cloud
                </div>
                <p className="text-xs text-muted-foreground">
                  Syncs with Reception, Bar, Kitchen, and Online Bookings in real-time.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div>
                <div className="font-semibold text-sm">Download Tuta Suites Desktop (.exe)</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Compatible with Windows 10, 11 (64-bit) & all Xprinter models
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <a
                  href="/downloads/Tuta-Suites-Setup.exe"
                  download="Tuta-Suites-Setup.exe"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-2">
                    <Download className="w-4 h-4" />
                    Setup Installer (.exe)
                  </Button>
                </a>
                <a
                  href="/downloads/Tuta-Suites-Portable.exe"
                  download="Tuta-Suites-Portable.exe"
                  className="w-full sm:w-auto"
                >
                  <Button variant="outline" className="w-full sm:w-auto text-xs gap-2">
                    <Download className="w-4 h-4" />
                    Portable (No Install)
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
