$INPUT_DIR = "unclassified"
$OUTPUT_DIR = "classified"
$THINNING_FACTOR = 20

# Get-ChildItem ".\$INPUT_DIR" -Filter *.laz | Foreach-Object {
#     Write-Host "Thinning and tilling $_"

#     $FileName, $Extension = (Split-Path -Path $_ -Leaf).Split(".")
#     $FileNameArray = $FileName.Split("_")
#     $MinX = $FileNameArray[2]
#     $MaxY = $FileNameArray[3]

#     for ($i = 0; $i -lt 4; $i++)
#     {
#         Start-Process -Wait -FilePath "las2las64" -ArgumentList @(
#             "-i $INPUT_DIR\$_",
#             "-o temp\thin\$($FileName)_thin_$($i + 1).$Extension",
#             "-keep_every_nth $THINNING_FACTOR",
#             "-keep_tile $($MinX)000 $($MinX - 1)000 500",
#         )
#     }
# }

Get-ChildItem ".\$INPUT_DIR" -Filter *.laz | Foreach-Object {
    Write-Host "Processing $_"

    $FileName, $Extension = (Split-Path -Path $_ -Leaf).Split(".")

    if (!(Test-Path "temp")) {
        New-Item "temp" -ItemType Directory
    }

    if (!(Test-Path "temp\thin")) {
        New-Item "temp\thin" -ItemType Directory
    }
    
    Start-Process -Wait -FilePath "las2las64" -ArgumentList "-i", "$INPUT_DIR\$_", "-o", "temp\thin\$($FileName)_thin.$Extension", "-keep_every_nth $THINNING_FACTOR"    

    if (!(Test-Path "temp\ground")) {
        New-Item "temp\ground" -ItemType Directory
    }
    
    Start-Process -Wait -FilePath "lasground64" -ArgumentList "-i", "temp\thin\$($FileName)_thin.$Extension", "-o", "temp\ground\$($FileName)_ground.$Extension"
    Remove-Item "temp\thin\$($FileName)_thin.$Extension"

    if (!(Test-Path "temp\height")) {
        New-Item "temp\height" -ItemType Directory
    }
    
    Start-Process -Wait -FilePath "lasheight64" -ArgumentList "-i", "temp\ground\$($FileName)_ground.$Extension", "-o", "temp\height\$($FileName)_height.$Extension"
    Remove-Item "temp\ground\$($FileName)_ground.$Extension"

    if (!(Test-Path "$OUTPUT_DIR")) {
        New-Item "$OUTPUT_DIR" -ItemType Directory
    }
    
    Start-Process -Wait -FilePath "lasclassify64" -ArgumentList "-i", "temp\height\$($FileName)_height.$Extension", "-o", "$OUTPUT_DIR\$($FileName)_classified.$Extension"
    Remove-Item "temp\height\$($FileName)_height.$Extension"
    Remove-Item "temp" -Recurse
}

Start-Process -Wait -FilePath "pullauta"
Start-Process -Wait -FilePath "pullauta"  -ArgumentList "pngmergedepr", "1"