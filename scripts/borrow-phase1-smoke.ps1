param(
  [Parameter(Mandatory = $true)]
  [string]$Token,
  [string]$BaseUrl = "http://localhost:3000"
)

$headers = @{ Authorization = "Bearer $Token" }

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Body,
    [string]$IdempotencyKey
  )

  $localHeaders = @{}
  foreach ($k in $headers.Keys) { $localHeaders[$k] = $headers[$k] }
  if ($IdempotencyKey) { $localHeaders["Idempotency-Key"] = $IdempotencyKey }

  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $localHeaders -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8)
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $localHeaders
}

Write-Host "[1/6] create customer success"
$customer = Invoke-Json -Method "POST" -Url "$BaseUrl/borrow/customers" -Body @{
  full_name = "Customer Script Demo"
  email = "customer.script.demo@smartbook.local"
  phone = "0912888888"
  status = "ACTIVE"
}
Write-Host "Created customer:" $customer.data.id

Write-Host "[2/6] reservation success"
$reservation = Invoke-Json -Method "POST" -Url "$BaseUrl/borrow/reservations" -IdempotencyKey "script-case2-001" -Body @{
  customer_id = "00000000-0000-0000-0000-000000000703"
  variant_id = "00000000-0000-0000-0000-000000000441"
  warehouse_id = "00000000-0000-0000-0000-000000000461"
  quantity = 1
  source_channel = "COUNTER"
}
Write-Host "Reservation:" $reservation.data.id

Write-Host "[3/6] reservation fail when no stock (expected 409)"
try {
  Invoke-Json -Method "POST" -Url "$BaseUrl/borrow/reservations" -IdempotencyKey "script-case3-001" -Body @{
    customer_id = "00000000-0000-0000-0000-000000000703"
    variant_id = "00000000-0000-0000-0000-000000000449"
    warehouse_id = "00000000-0000-0000-0000-000000000461"
    quantity = 1
    source_channel = "WEB"
  } | Out-Null
  Write-Host "Unexpected success" -ForegroundColor Red
} catch {
  Write-Host "Expected fail:" $_.Exception.Message -ForegroundColor Yellow
}

Write-Host "[4/6] reservation cancel success"
$cancel = Invoke-Json -Method "PATCH" -Url "$BaseUrl/borrow/reservations/$($reservation.data.id)/cancel" -IdempotencyKey "script-case4-001"
Write-Host "Cancelled status:" $cancel.data.status

Write-Host "[5/6] reservation blocked by unpaid fine (expected 409)"
try {
  Invoke-Json -Method "POST" -Url "$BaseUrl/borrow/reservations" -IdempotencyKey "script-case5-001" -Body @{
    customer_id = "00000000-0000-0000-0000-000000000704"
    variant_id = "00000000-0000-0000-0000-000000000441"
    warehouse_id = "00000000-0000-0000-0000-000000000461"
    quantity = 1
    source_channel = "COUNTER"
  } | Out-Null
  Write-Host "Unexpected success" -ForegroundColor Red
} catch {
  Write-Host "Expected fail:" $_.Exception.Message -ForegroundColor Yellow
}

Write-Host "[6/6] reservation blocked by membership limit (expected 409)"
try {
  Invoke-Json -Method "POST" -Url "$BaseUrl/borrow/reservations" -IdempotencyKey "script-case6-001" -Body @{
    customer_id = "00000000-0000-0000-0000-000000000705"
    variant_id = "00000000-0000-0000-0000-000000000441"
    warehouse_id = "00000000-0000-0000-0000-000000000461"
    quantity = 1
    source_channel = "COUNTER"
  } | Out-Null
  Write-Host "Unexpected success" -ForegroundColor Red
} catch {
  Write-Host "Expected fail:" $_.Exception.Message -ForegroundColor Yellow
}

Write-Host "Done"
