# ===================================================================
#  Tree.ps1 - Export de l'arborescence G:\terra-dominus dans structure.txt
#  - Exclut : G:\terra-dominus\node_modules
#             G:\terra-dominus\frontend\node_modules
#             G:\terra-dominus\backend\node_modules
# ===================================================================

param(
    [string]$RootPath = "G:\terra-dominus",
    [string]$OutputFile = "structure.txt"
)

function Get-FolderStructure {
    param (
        [string]$Path,
        [int]$IndentLevel
    )

    # Récupère les fichiers et dossiers, triés : dossiers d'abord
    $items = Get-ChildItem -Path $Path -Force | Sort-Object PSIsContainer, Name

    foreach ($item in $items) {

        # Exclusions des node_modules
        if ($item.FullName -like "$RootPath\node_modules*" -or
            $item.FullName -like "$RootPath\frontend\node_modules*" -or
            $item.FullName -like "$RootPath\backend\node_modules*") {
            continue
        }

        # Indentation
        $indent = " " * ($IndentLevel * 2)

        # Préfixe simple pour différencier dossier/fichier
        if ($item.PSIsContainer) {
            $line = "$indent+ $($item.Name)"
        } else {
            $line = "$indent- $($item.Name)"
        }

        Write-Output $line

        # Récursion sur les sous-dossiers
        if ($item.PSIsContainer) {
            Get-FolderStructure -Path $item.FullName -IndentLevel ($IndentLevel + 1)
        }
    }
}

# Lancer la construction et écrire dans le fichier texte
Get-FolderStructure -Path $RootPath -IndentLevel 0 | Out-File -FilePath $OutputFile -Encoding UTF8

# Ouvrir le fichier dans le bloc-notes
Start-Process notepad.exe $OutputFile
