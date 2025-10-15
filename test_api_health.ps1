# PowerShell script to test API health check endpoint

param (
    [Parameter(Mandatory=$true)]
    [string]$ApiBaseUrl
)

# Health check endpoint URL
$HealthCheckUrl = "$ApiBaseUrl/health-check/"

Write-Host "Testing API health check endpoint at $HealthCheckUrl" -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

# Function to display test result
function Display-TestResult {
    param (
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "[PASS] $Message" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Message" -ForegroundColor Red
    }
}

# Test 1: Basic connectivity test
Write-Host "Testing basic connectivity..." -NoNewline
try {
    $Response = Invoke-WebRequest -Uri $HealthCheckUrl -UseBasicParsing -ErrorAction Stop
    Write-Host " OK (Status: $($Response.StatusCode))" -ForegroundColor Green
    Display-TestResult -Success $true -Message "API is accessible"
} catch {
    $StatusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " FAILED (Status: $StatusCode)" -ForegroundColor Red
    Display-TestResult -Success $false -Message "API is not accessible"
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Check response content
Write-Host "Checking response content..." -NoNewline
try {
    $Content = $Response.Content | ConvertFrom-Json
    if ($Content.status -eq "ok") {
        Write-Host " OK" -ForegroundColor Green
        Display-TestResult -Success $true -Message "API returned correct response format"
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Display-TestResult -Success $false -Message "API returned unexpected status: $($Content.status)"
        Write-Host "Response content: $($Response.Content)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FAILED (Unable to parse JSON)" -ForegroundColor Red
    Display-TestResult -Success $false -Message "API did not return valid JSON"
    Write-Host "Response content: $($Response.Content)" -ForegroundColor Red
    exit 1
}

# Test 3: Response time
Write-Host "Checking response time..." -NoNewline
$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $Response = Invoke-WebRequest -Uri $HealthCheckUrl -UseBasicParsing
    $Stopwatch.Stop()
    $ResponseTime = $Stopwatch.Elapsed.TotalSeconds
    if ($ResponseTime -lt 2.0) {
        Write-Host " OK ($ResponseTime seconds)" -ForegroundColor Green
        Display-TestResult -Success $true -Message "API response time is acceptable"
    } else {
        Write-Host " WARNING ($ResponseTime seconds)" -ForegroundColor Yellow
        Display-TestResult -Success $false -Message "API response time is slow (>2 seconds)"
    }
} catch {
    $Stopwatch.Stop()
    Write-Host " FAILED" -ForegroundColor Red
    Display-TestResult -Success $false -Message "Failed to get response time"
    exit 1
}

# Display system info from health check
Write-Host "`nSystem Information from API:" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan
$SystemInfo = $Content.system_info
Write-Host "Hostname: $($SystemInfo.hostname)"
Write-Host "Platform: $($SystemInfo.platform)"
Write-Host "Python Version: $($SystemInfo.python_version)"
Write-Host "Django Version: $($SystemInfo.django_version)"
Write-Host "Database: $($Content.database)"

Write-Host "`nAll tests completed successfully!" -ForegroundColor Green
Write-Host "API health check endpoint is working correctly at: $HealthCheckUrl" -ForegroundColor Green