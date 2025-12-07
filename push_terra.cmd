@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================
rem push_terra.cmd
rem Push automatique vers GitHub pour terra-dominus
rem
rem Usage :
rem   push_terra.cmd
rem   push_terra.cmd "Ajout page Centre d'entrainement"
rem   push_terra.cmd "Sync complet" --force
rem   push_terra.cmd --force "Sync complet"
rem
rem Options :
rem   -f / --force   = force push (ecrase le distant)
rem
rem Le script :
rem   - se place dans le dossier du script (racine projet)
rem   - init git si besoin
rem   - s'assure d'etre sur main
rem   - ajoute/maj le remote origin
rem   - add/commit/push
rem ============================================================

rem ---- Config ----
set "REPO_PATH=%~dp0"
set "REMOTE_NAME=origin"
set "REMOTE_URL=https://github.com/MacMuffin76/terra-dominus.git"
set "BRANCH_NAME=main"
rem ----------------

set "FORCE=0"
set "MSG="

rem ---- Parse args ----
for %%A in (%*) do (
  set "ARG=%%~A"
  if /i "!ARG!"=="-f" (
    set "FORCE=1"
  ) else if /i "!ARG!"=="--force" (
    set "FORCE=1"
  ) else if /i "!ARG!"=="-force" (
    set "FORCE=1"
  ) else if not defined MSG (
    set "MSG=!ARG!"
  )
)

rem ---- Message par defaut si absent ----
if not defined MSG (
  for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format ''yyyy-MM-dd HH:mm''"') do set "TS=%%T"
  set "MSG=Auto update !TS!"
)

echo === Push Terra Dominus ===
echo Repo local : "%REPO_PATH%"
echo Remote     : "%REMOTE_URL%"
echo Branche    : "%BRANCH_NAME%"
echo Message    : "%MSG%"
echo Force push : %FORCE%
echo ---------------------------

rem ---- Verifie Git ----
git --version >nul 2>&1
if errorlevel 1 (
  echo ERREUR: Git n'est pas installe ou pas dans le PATH.
  exit /b 1
)

rem ---- Va dans le repo ----
cd /d "%REPO_PATH%"

rem ---- Init si besoin ----
if not exist ".git" (
  echo Repo Git non trouve. Initialisation...
  git init
  if errorlevel 1 exit /b 1
)

rem ---- S'assure d'etre sur main ----
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURBR=%%B"
if /i not "%CURBR%"=="%BRANCH_NAME%" (
  echo Renommage de la branche "%CURBR%" -> "%BRANCH_NAME%"...
  git branch -M %BRANCH_NAME%
  if errorlevel 1 exit /b 1
)

rem ---- Remote origin ----
git remote get-url %REMOTE_NAME% >nul 2>&1
if errorlevel 1 (
  echo Remote "%REMOTE_NAME%" absent. Ajout...
  git remote add %REMOTE_NAME% %REMOTE_URL%
  if errorlevel 1 exit /b 1
) else (
  for /f "delims=" %%R in ('git remote get-url %REMOTE_NAME%') do set "EXIST_REMOTE=%%R"
  if /i not "!EXIST_REMOTE!"=="%REMOTE_URL%" (
    echo Remote "%REMOTE_NAME%" different: "!EXIST_REMOTE!"
    echo Mise a jour vers: "%REMOTE_URL%"
    git remote set-url %REMOTE_NAME% %REMOTE_URL%
    if errorlevel 1 exit /b 1
  )
)

rem ---- Add ----
echo Ajout des fichiers...
git add -A
if errorlevel 1 exit /b 1

rem ---- Detecte changements ----
set "HASCHG="
for /f "delims=" %%C in ('git status --porcelain') do set "HASCHG=1"
if not defined HASCHG (
  echo Aucun changement a commit. Rien a push.
  exit /b 0
)

rem ---- Commit ----
echo Commit...
git commit -m "%MSG%"
if errorlevel 1 (
  echo ERREUR: Commit impossible (peut-etre rien a commit).
  exit /b 1
)

rem ---- Push ----
echo Push...
if "%FORCE%"=="1" (
  git push -f -u %REMOTE_NAME% %BRANCH_NAME%
) else (
  git push -u %REMOTE_NAME% %BRANCH_NAME%
)

if errorlevel 1 (
  echo ERREUR: Push echoue.
  exit /b 1
)

echo ✅ Termine !
