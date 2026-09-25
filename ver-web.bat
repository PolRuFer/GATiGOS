@echo off
rem Vista previa local de GatYGos (Windows): doble clic.
rem Requiere Node.js 20+ (https://nodejs.org). La primera vez instala liquidjs.
cd /d "%~dp0dev\preview"
if not exist node_modules\liquidjs (
  echo Instalando dependencias de la vista previa...
  call npm install --no-save liquidjs
)
start "" http://localhost:4173/index.html
echo.
echo  GatYGos en http://localhost:4173  (home)  y  /collection.html  (coleccion)
echo  Guarda cambios en el codigo y recarga el navegador. Cierra esta ventana para parar.
echo.
node serve.js
