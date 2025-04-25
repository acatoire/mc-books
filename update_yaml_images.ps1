# Get all animal folders
$animalFolders = Get-ChildItem -Path "animal" -Directory -Filter "a_*"

foreach ($folder in $animalFolders) {
    $animalName = $folder.Name.Substring(2) # Remove 'a_' prefix
    $yamlPath = Join-Path $folder.FullName "$animalName.yaml"
    
    if (Test-Path $yamlPath) {
        Write-Host "Processing $animalName..."
        
        # Get all images in the folder
        $images = Get-ChildItem -Path $folder.FullName -File -Include @("*.gif", "*.png", "*.jpg", "*.jpeg")
        
        # Read YAML content
        $yamlContent = Get-Content $yamlPath -Raw
        
        # Find first GIF for main image
        $mainGif = $images | Where-Object { $_.Extension -eq ".gif" } | Select-Object -First 1
        if ($mainGif) {
            $mainImageName = $mainGif.Name
        } else {
            # If no GIF, use first image
            $mainImageName = $images[0].Name
        }
        
        # Create gallery array of all images
        $galleryImages = $images | ForEach-Object { $_.Name }
        
        # Convert gallery array to YAML format
        $galleryYaml = "    gallery:`n"
        foreach ($img in $galleryImages) {
            $galleryYaml += "      - $img`n"
        }
        
        # Update images section in YAML
        $newImagesSection = @"
  images:
    main: $mainImageName
    items:
      - $mainImageName
$galleryYaml
"@
        
        # Replace existing images section or add new one
        if ($yamlContent -match "(?ms)  images:.*?(?=\n  \w|$)") {
            $yamlContent = $yamlContent -replace "(?ms)  images:.*?(?=\n  \w|$)", $newImagesSection
        } else {
            $yamlContent += "`n$newImagesSection"
        }
        
        # Save updated YAML
        $yamlContent | Set-Content $yamlPath -NoNewline
        Write-Host "Updated $animalName.yaml with ${images.Count} images"
    } else {
        Write-Host "Warning: YAML file not found for $animalName"
    }
} 