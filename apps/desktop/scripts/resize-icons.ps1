Add-Type -AssemblyName System.Drawing

$src = 'c:/Users/athar/OneDrive/Desktop/AniVault/apps/website/public/press-kit/logo-mark.png'
$out = 'c:/Users/athar/OneDrive/Desktop/AniVault/apps/desktop/assets/icon'
$sizes = 256, 128, 64, 48, 32, 16

if (-not (Test-Path $out)) {
  New-Item -ItemType Directory -Path $out -Force | Out-Null
}

foreach ($s in $sizes) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($s, $s)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $s, $s)
  $img.Dispose()
  $g.Dispose()
  $dest = Join-Path $out ("anivault-{0}.png" -f $s)
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $dest"
}

# Create ICO from 256px PNG
$bmpIco = [System.Drawing.Bitmap]::FromFile((Join-Path $out 'anivault-256.png'))
$icon = [System.Drawing.Icon]::FromHandle($bmpIco.GetHicon())
$fs = [System.IO.File]::Create((Join-Path $out 'anivault.ico'))
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmpIco.Dispose()
Write-Host 'Wrote ICO'
