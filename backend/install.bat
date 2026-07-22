@echo off
echo ========================================
echo   Installing Python dependencies...
echo   Using Tsinghua mirror source
echo ========================================
echo.

REM Clear proxy settings that might be causing issues
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=

REM Install with Tsinghua mirror
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Installation successful!
    echo   You can now run: python main.py
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   Installation failed. Trying Aliyun mirror...
    echo ========================================
    pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
)

pause
