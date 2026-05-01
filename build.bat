@echo off
REM Builds the Docker image for linux/amd64
REM Usage: build.bat

set IMAGE=family_cashflow:latest

echo ==> Building image %IMAGE% for linux/amd64 ...
docker build --platform linux/amd64 --no-cache -t %IMAGE% .

echo ==> Saving to family_cashflow.tar ...
docker save %IMAGE% -o family_cashflow.tar

echo.
echo Done! family_cashflow.tar is ready for import.
echo Portainer:           Images - Import - select family_cashflow.tar
echo QNAP Container St.:  Images - Import from file - select family_cashflow.tar
