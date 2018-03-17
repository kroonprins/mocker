@echo off

net session >nul 2>&1
if %ERRORLEVEL% EQU 0 (
	if exist .git\hooks (
		rmdir /s /q .git\hooks
		mklink /d .git\hooks ..\.githooks\
	)
) else (
  if exist .git\hooks (
    copy .githooks\* .git\hooks\
  )
)

if not exist .\lib\mjs_workaround (
	echo Creating mjs workaround directory
	mkdir .\lib\mjs_workaround
)

if exist .\node_modules\serializr\lib\es\serializr.js (
	echo Copying serializr to mjs
	copy .\node_modules\serializr\lib\es\serializr.js lib\mjs_workaround\serializr-es6-module-loader.mjs
)

if exist ..\..\serializr\lib\es\serializr.js (
	echo Copying serializr to mjs
	copy ..\..\serializr\lib\es\serializr.js lib\mjs_workaround\serializr-es6-module-loader.mjs
)

cd .\ui
call npm install
call npm run build-prod
cd ..
