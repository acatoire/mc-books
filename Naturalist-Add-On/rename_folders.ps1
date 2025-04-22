# Get all directories in the current directory
$directories = Get-ChildItem -Directory

foreach ($dir in $directories) {
    $oldName = $dir.Name
    $newName = $oldName -replace ' ', '_'
    
    if ($oldName -ne $newName) {
        Write-Host "Renaming '$oldName' to '$newName'"
        Rename-Item -Path $dir.FullName -NewName $newName
    }
}

Write-Host "Folder renaming complete!" 