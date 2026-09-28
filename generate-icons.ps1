Add-Type -AssemblyName System.Drawing

function New-AavyIcon([int]$Size, [string]$Path, [bool]$Maskable = $false) {
  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $bitmap.SetResolution(144, 144)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(9, 9, 10))

  $gold = [System.Drawing.Color]::FromArgb(222, 197, 137)
  $muted = [System.Drawing.Color]::FromArgb(112, 108, 103)
  $pen = [System.Drawing.Pen]::new($gold, [Math]::Max(3, $Size / 80))
  $pen.StartCap = $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $thin = [System.Drawing.Pen]::new($muted, [Math]::Max(2, $Size / 130))
  $inset = if ($Maskable) { [int]($Size * .24) } else { [int]($Size * .17) }
  $unit = ($Size - 2 * $inset) / 10

  $camera = [System.Drawing.RectangleF]::new($inset, $inset + 2.7*$unit, 10*$unit, 6.1*$unit)
  $graphics.DrawRectangle($pen, $camera.X, $camera.Y, $camera.Width, $camera.Height)
  $graphics.DrawLines($pen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($inset + 2.1*$unit, $inset + 2.7*$unit),
    [System.Drawing.PointF]::new($inset + 3.1*$unit, $inset + 1.25*$unit),
    [System.Drawing.PointF]::new($inset + 6.7*$unit, $inset + 1.25*$unit),
    [System.Drawing.PointF]::new($inset + 7.8*$unit, $inset + 2.7*$unit)
  ))
  $graphics.DrawEllipse($pen, $inset + 3.1*$unit, $inset + 3.25*$unit, 3.9*$unit, 3.9*$unit)
  $graphics.DrawEllipse($thin, $inset + 4.15*$unit, $inset + 4.3*$unit, 1.8*$unit, 1.8*$unit)
  $graphics.DrawEllipse($pen, $inset + 4.75*$unit, $inset + 4.9*$unit, .6*$unit, .6*$unit)
  $graphics.DrawLine($thin, $inset + .9*$unit, $inset + 4*$unit, $inset + 2.2*$unit, $inset + 4*$unit)
  $graphics.DrawLine($thin, $inset + 8.2*$unit, $inset + 4*$unit, $inset + 9.1*$unit, $inset + 4*$unit)

  $graphics.Dispose(); $pen.Dispose(); $thin.Dispose()
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

New-AavyIcon 192 (Join-Path $PSScriptRoot "icon-192.png")
New-AavyIcon 512 (Join-Path $PSScriptRoot "icon-512.png")
New-AavyIcon 512 (Join-Path $PSScriptRoot "icon-maskable-512.png") $true
New-AavyIcon 180 (Join-Path $PSScriptRoot "apple-touch-icon.png")
Copy-Item -Force (Join-Path $PSScriptRoot "apple-touch-icon.png") (Join-Path $PSScriptRoot "apple-touch-icon-precomposed.png")
New-AavyIcon 32 (Join-Path $PSScriptRoot "favicon.png")
