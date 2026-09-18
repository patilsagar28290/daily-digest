Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('e:\projects\ai\dev-digest\assets\icon.png')
$img.Save('e:\projects\ai\dev-digest\assets\icon_real.png', [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()

$img2 = [System.Drawing.Image]::FromFile('e:\projects\ai\dev-digest\assets\adaptive-icon.png')
$img2.Save('e:\projects\ai\dev-digest\assets\adaptive-icon_real.png', [System.Drawing.Imaging.ImageFormat]::Png)
$img2.Dispose()

Remove-Item 'e:\projects\ai\dev-digest\assets\icon.png'
Remove-Item 'e:\projects\ai\dev-digest\assets\adaptive-icon.png'

Rename-Item 'e:\projects\ai\dev-digest\assets\icon_real.png' 'icon.png'
Rename-Item 'e:\projects\ai\dev-digest\assets\adaptive-icon_real.png' 'adaptive-icon.png'
