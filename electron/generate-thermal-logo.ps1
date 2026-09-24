Add-Type -AssemblyName System.Drawing

$logoPath = Join-Path $PSScriptRoot '..\public\logo.png'
$previewPath = Join-Path $PSScriptRoot 'thermal-logo-preview.png'
$binPath = Join-Path $PSScriptRoot 'thermal-logo.bin'

$src = [System.Drawing.Bitmap]::FromFile($logoPath)

# Emblem bounds: X=38..1216, Y=175..1100
$cropX = 38
$cropY = 175
$cropW = 1179
$cropH = 925

# Make logo compact and elegant: 128 dots wide (16 bytes)
# Height: 128 * (925 / 1179) = 100 dots
$logoW = 128
$logoH = [int]([Math]::Round($cropH * ($logoW / $cropW))) # 100 dots

$paperDotsW = 576
$paperBytesW = [int]($paperDotsW / 8) # 72 bytes
$logoBytesW = [int]($logoW / 8)       # 16 bytes
$leftPadBytes = [int](($paperBytesW - $logoBytesW) / 2) # 28 bytes
$rightPadBytes = [int]($paperBytesW - $logoBytesW - $leftPadBytes) # 28 bytes

# Add 4 blank scanlines top and bottom for neat spacing
$topMarginDots = 4
$bottomMarginDots = 4
$totalH = $logoH + $topMarginDots + $bottomMarginDots

# Step 1: Scale cropped emblem to logoW x logoH in high quality
$scaledBmp = New-Object System.Drawing.Bitmap($logoW, $logoH)
$g = [System.Drawing.Graphics]::FromImage($scaledBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::White)

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $logoW, $logoH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$src.Dispose()

# Step 2: Create full 576-dot wide preview bitmap
$previewBmp = New-Object System.Drawing.Bitmap($paperDotsW, $totalH)
$pg = [System.Drawing.Graphics]::FromImage($previewBmp)
$pg.Clear([System.Drawing.Color]::White)
$pg.Dispose()

# Step 3: ESC/POS Header for GS v 0
# GS v 0 m xL xH yL yH
$escposBytes = [System.Collections.Generic.List[byte]]::new()
$escposBytes.Add(0x1D) # GS
$escposBytes.Add(0x76) # v
$escposBytes.Add(0x30) # 0
$escposBytes.Add(0x00) # m = 0 (normal)
$escposBytes.Add([byte]($paperBytesW % 256)) # xL = 72
$escposBytes.Add([byte]([Math]::Floor($paperBytesW / 256))) # xH = 0
$escposBytes.Add([byte]($totalH % 256)) # yL = 108
$escposBytes.Add([byte]([Math]::Floor($totalH / 256))) # yH = 0

# Threshold: pixels darker than 180 become 1 (black dot)
$threshold = 180

# 1. Top margin lines (all white)
for ($y = 0; $y -lt $topMarginDots; $y++) {
    for ($b = 0; $b -lt $paperBytesW; $b++) {
        $escposBytes.Add([byte]0)
    }
}

# 2. Emblem lines
for ($y = 0; $y -lt $logoH; $y++) {
    $rowBytes = New-Object byte[] $paperBytesW # 72 bytes initialized to 0

    for ($x = 0; $x -lt $logoW; $x++) {
        $c = $scaledBmp.GetPixel($x, $y)
        $brightness = [int]($c.R * 0.299 + $c.G * 0.587 + $c.B * 0.114)
        if ($brightness -lt $threshold) {
            # Black dot!
            $paperX = [int]($leftPadBytes * 8 + $x)
            $previewBmp.SetPixel($paperX, ($y + $topMarginDots), [System.Drawing.Color]::Black)

            $byteIdx = [int]($leftPadBytes + [Math]::Floor($x / 8))
            $bitIdx = 7 - ($x % 8)
            $rowBytes[$byteIdx] = $rowBytes[$byteIdx] -bor (1 -shl $bitIdx)
        }
    }

    foreach ($b in $rowBytes) {
        $escposBytes.Add($b)
    }
}

# 3. Bottom margin lines (all white)
for ($y = 0; $y -lt $bottomMarginDots; $y++) {
    for ($b = 0; $b -lt $paperBytesW; $b++) {
        $escposBytes.Add([byte]0)
    }
}

$scaledBmp.Dispose()

$previewBmp.Save($previewPath, [System.Drawing.Imaging.ImageFormat]::Png)
$previewBmp.Dispose()

[System.IO.File]::WriteAllBytes($binPath, $escposBytes.ToArray())

Write-Host "✅ Generated thermal logo: $($logoW)x$($totalH) dots ($($escposBytes.Count) bytes)"
