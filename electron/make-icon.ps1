Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\logo.png"
$outPng = Join-Path $PSScriptRoot "icon.png"
$outIco = Join-Path $PSScriptRoot "icon.ico"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function Get-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Create-IconBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = [float]$size / 256.0
    $pad = [float](6.0 * $scale)
    $cardW = [float]($size - ($pad * 2.0))
    $cardH = [float]($size - ($pad * 2.0))
    $radius = [float](44.0 * $scale)
    $path = Get-RoundedRectPath $pad $pad $cardW $cardH $radius

    $brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($brushWhite, $path)

    $penWidth = [Math]::Max(1.0, [float](3.0 * $scale))
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 212, 175, 55), $penWidth)
    $g.DrawPath($goldPen, $path)

    $g.SetClip([System.Drawing.Drawing2D.GraphicsPath]$path)

    $innerW = [float](208.0 * $scale)
    $innerH = [float](208.0 * $scale)
    $offsetX = [float](($size - $innerW) / 2.0)
    $offsetY = [float](($size - $innerH) / 2.0)
    $g.DrawImage($src, $offsetX, $offsetY, $innerW, $innerH)

    $g.ResetClip()
    $goldPen.Dispose()
    $brushWhite.Dispose()
    $path.Dispose()
    $g.Dispose()

    return $bmp
}

# 1. Save 256x256 icon.png
$bmp256 = Create-IconBitmap 256
$bmp256.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "✅ Saved icon.png (256x256)"

# 2. Build multi-resolution icon.ico (256, 128, 64, 48, 32, 16)
$sizes = @(256, 128, 64, 48, 32, 16)
$pngBytesList = [System.Collections.Generic.List[byte[]]]::new()

foreach ($s in $sizes) {
    $b = if ($s -eq 256) { $bmp256 } else { Create-IconBitmap $s }
    $ms = New-Object System.IO.MemoryStream
    $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList.Add($ms.ToArray())
    $ms.Dispose()
    if ($s -ne 256) { $b.Dispose() }
}
$bmp256.Dispose()
$src.Dispose()

# Assemble ICO binary format
$icoStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($icoStream)

# Header: 0, 1 (icon), count
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$sizes.Count)

# Calculate image data offset
$headerSize = 6
$dirEntrySize = 16
$offset = $headerSize + ($dirEntrySize * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $data = $pngBytesList[$i]
    $wByte = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $hByte = if ($s -ge 256) { [byte]0 } else { [byte]$s }

    $writer.Write($wByte)       # Width
    $writer.Write($hByte)       # Height
    $writer.Write([byte]0)      # Colors
    $writer.Write([byte]0)      # Reserved
    $writer.Write([UInt16]1)    # Planes
    $writer.Write([UInt16]32)   # BitCount
    $writer.Write([UInt32]$data.Length) # SizeInBytes
    $writer.Write([UInt32]$offset)      # Offset

    $offset += $data.Length
}

# Write image data
foreach ($data in $pngBytesList) {
    $writer.Write($data)
}

$writer.Flush()
[System.IO.File]::WriteAllBytes($outIco, $icoStream.ToArray())
$writer.Dispose()
$icoStream.Dispose()

Write-Host "✅ Saved icon.ico with $($sizes.Count) resolutions ($($sizes -join ', '))"
