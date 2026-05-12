$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$Root\.tools\node-v24.14.1-win-x64\node.exe" "$Root\server.js"
