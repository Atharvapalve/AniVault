Add-Type -AssemblyName System.Drawing
$src = 'c:/Users/athar/OneDrive/Desktop/AniVault/apps/website/public/press-kit/logo-mark.png'
$out = 'c:/Users/athar/OneDrive/Desktop/AniVault/apps/extension/icons'
$sizes = 16,32,48,128

foreach ($s in $sizes) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($s, $s)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $s, $s)
  $img.Dispose()
  $g.Dispose()
  $dest = Join-Path $out ("icon-$s.png")
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $dest"
}
