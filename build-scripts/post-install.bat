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
