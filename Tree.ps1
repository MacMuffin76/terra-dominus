function Get-FolderStructure {
    param (
        [string]$Path = ".",
        [int]$IndentLevel = 0
    )

    # Obtenir les éléments dans le chemin spécifié
    $items = Get-ChildItem -Path $Path

    foreach ($item in $items) {
        # Vérifier si l'élément doit être exclu
        if ($item.FullName -like "G:\terra-dominus\node_modules*" -or
            $item.FullName -like "G:\terra-dominus\frontend\node_modules*" -or
            $item.FullName -like "G:\terra-dominus\backend\node_modules*") {
            continue  # Ignorer cet élément et passer au suivant
        }

        # Construire l'indentation
        $indent = " " * $IndentLevel * 2

        # Afficher le nom de l'élément
        Write-Output "$indent$item"

        # Récursivement afficher les sous-répertoires
        if ($item.PSIsContainer) {
            Get-FolderStructure -Path $item.FullName -IndentLevel ($IndentLevel + 1)
        }
    }
}

# Exemple d'utilisation : Afficher la structure du répertoire E:\terra-dominus
# Rediriger la sortie vers un fichier texte
Get-FolderStructure -Path "G:\terra-dominus" | Out-File -FilePath "structure.txt"

# Afficher le contenu du fichier
notepad.exe "structure.txt"

