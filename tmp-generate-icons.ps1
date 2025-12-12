Add-Type -AssemblyName System.Drawing
 = 'c:/Users/athar/OneDrive/Desktop/AniVault/apps/website/public/press-kit/logo-mark.png'
 = 'c:/Users/athar/OneDrive/Desktop/AniVault/apps/extension/icons'
 = 16,32,48,128
foreach ( in ) {
   = [System.Drawing.Image]::FromFile()
   = New-Object System.Drawing.Bitmap(, )
   = [System.Drawing.Graphics]::FromImage()
  .InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  .DrawImage(, 0, 0, , )
  .Dispose()
  .Dispose()
   = Join-Path  ( icon-.png)
  .Save(, [System.Drawing.Imaging.ImageFormat]::Png)
  .Dispose()
  Write-Host Wrote 
}
