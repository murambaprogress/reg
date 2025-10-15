# PowerShell script for updating the Regimark Motors Control Center on PythonAnywhere
# This script should be run locally to build and package updates

# Set variables
$projectRoot = "c:\Users\HP\Music\regimark_motors_control_center"
$deploymentDate = Get-Date -Format "yyyyMMdd_HHmmss"
$deploymentPackage = "regimark_deploy_$deploymentDate.zip"

# Check if project directory exists
if (-not (Test-Path $projectRoot)) {
    Write-Host "Error: Project root not found at $projectRoot" -ForegroundColor Red
    exit 1
}

# Navigate to project root
Set-Location $projectRoot
Write-Host "Starting deployment update process from $projectRoot" -ForegroundColor Cyan

# Step 1: Build the frontend
Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend build complete" -ForegroundColor Green

# Step 2: Create a deployment package
Write-Host "Creating deployment package..." -ForegroundColor Cyan

# Create deployment directory if it doesn't exist
if (-not (Test-Path "deploy_package")) {
    New-Item -ItemType Directory -Path "deploy_package" | Out-Null
}

# Copy build files
Write-Host "Copying build files..." -ForegroundColor Cyan
Copy-Item -Path "build" -Destination "deploy_package\build" -Recurse -Force

# Copy backend files
Write-Host "Copying backend files..." -ForegroundColor Cyan
Copy-Item -Path "backend" -Destination "deploy_package\backend" -Recurse -Force

# Copy deployment scripts
Write-Host "Copying deployment scripts..." -ForegroundColor Cyan
Copy-Item -Path "deploy_pythonanywhere.sh" -Destination "deploy_package\" -Force
Copy-Item -Path "PYTHONANYWHERE_FRONTEND_DEPLOYMENT.md" -Destination "deploy_package\" -Force
Copy-Item -Path "DEPLOYMENT_GUIDE.md" -Destination "deploy_package\" -Force

# Create README for the deployment package
$readmeContent = @"
Regimark Motors Control Center Deployment Package
================================================

This package contains the following:
1. build/ - Frontend build files
2. backend/ - Backend Django application
3. DEPLOYMENT_GUIDE.md - Complete deployment guide
4. PYTHONANYWHERE_FRONTEND_DEPLOYMENT.md - Frontend deployment guide
5. deploy_pythonanywhere.sh - Script for PythonAnywhere setup

Generated on: $deploymentDate

To deploy:
1. Upload this package to PythonAnywhere
2. Extract the files
3. Run deploy_pythonanywhere.sh
4. Reload your web app
"@

$readmeContent | Out-File -FilePath "deploy_package\README.txt"

# Step 3: Create the deployment archive
Write-Host "Creating deployment archive: $deploymentPackage" -ForegroundColor Cyan
Compress-Archive -Path "deploy_package\*" -DestinationPath $deploymentPackage -Force

# Step 4: Clean up
Write-Host "Cleaning up..." -ForegroundColor Cyan
Remove-Item -Path "deploy_package" -Recurse -Force

Write-Host "Deployment package created: $deploymentPackage" -ForegroundColor Green
Write-Host "Upload this package to PythonAnywhere and follow the instructions in the deployment guides." -ForegroundColor Yellow