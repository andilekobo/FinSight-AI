$ErrorActionPreference = "Stop"
Write-Host "`n=== FINSIGHT AI GUARDRAILS ===" -ForegroundColor Cyan
if (!(Test-Path ".\app\main.py")) { throw "Backend entry point missing." }
if (!(Test-Path ".\frontend\package.json")) { throw "Frontend entry point missing." }
if (!(Test-Path ".\.venv\Scripts\python.exe")) { throw "Virtual environment missing." }
if (!(Test-Path ".\.env")) { throw ".env missing. No changes made." }
$py = (Resolve-Path ".\.venv\Scripts\python.exe").Path
& $py -c "from app.main import app; print('PASS: backend imports; routes:', len(app.routes))"
if ($LASTEXITCODE -ne 0) { throw "Backend import failed." }
& $py -c "from dotenv import load_dotenv; import os,sys; load_dotenv(override=False); missing=[k for k in ('DATABASE_URL','JWT_SECRET_KEY') if not os.getenv(k)]; print('Missing: ' + ', '.join(missing)) if missing else print('PASS: required environment variables present'); sys.exit(bool(missing))"
if ($LASTEXITCODE -ne 0) { throw "Environment validation failed." }
& $py -c "from sqlalchemy import text; from app.db.database import engine; c=engine.connect(); c.execute(text('SELECT 1')); c.close(); print('PASS: database connection')"
if ($LASTEXITCODE -ne 0) { throw "Database check failed. Do not reset the database." }
if (!(Test-Path ".\frontend\node_modules")) { throw "Frontend dependencies missing." }
Push-Location ".\frontend"
try { npm ls --depth=0; if ($LASTEXITCODE -ne 0) { throw "Frontend dependencies failed validation." } }
finally { Pop-Location }
foreach ($url in @("http://127.0.0.1:8000/openapi.json","http://127.0.0.1:5173/")) { try { $r=Invoke-WebRequest $url -TimeoutSec 3; Write-Host "[PASS] $url ($($r.StatusCode))" -ForegroundColor Green } catch { Write-Host "[WARN] $url is not responding; no process changed." -ForegroundColor Yellow } }
if (Get-Command git -ErrorAction SilentlyContinue) { git diff --check; if ($LASTEXITCODE -ne 0) { Write-Host "[WARN] Git formatting check found issues. Review them; no files changed." -ForegroundColor Yellow } }
Write-Host "`nGUARDRAIL CHECKS COMPLETED. Review any WARN messages above." -ForegroundColor Cyan
