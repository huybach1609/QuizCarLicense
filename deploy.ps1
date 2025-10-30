#!/usr/bin/env pwsh

$USERNAME = "weback1609"
$HOSTNAME = "proxmox-apps-01"
$SERVER_PATH = "/shares-nfs/personal/apps"
$CONTAINER_NAME = "quizcarlicense"
$PORT = 6789

Write-Host "🏗️  Building Docker image..." -ForegroundColor Blue
docker build -t "$USERNAME/quizcarlicense:latest" . 2>&1 | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green

Write-Host "📤 Pushing to Docker Hub..." -ForegroundColor Blue
docker push "$USERNAME/quizcarlicense:latest" 2>&1 | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Push successful!" -ForegroundColor Green

Write-Host "🚀 Deploying to server..." -ForegroundColor Blue


$deployCmd = "cd $SERVER_PATH && " +
             "echo '📥 Pulling latest image...' && " +
             "docker pull $USERNAME/quizcarlicense:latest && " +
             "echo '🛑 Stopping container...' && " +
             "(docker compose stop $CONTAINER_NAME || echo 'Container not running') && " +
             "echo '🗑️  Removing container...' && " +
             "(docker compose rm -f $CONTAINER_NAME || echo 'No container to remove') && " +
             "echo '🚀 Starting new container...' && " +
             "docker compose up -d $CONTAINER_NAME && " +
             "echo '⏳ Waiting for startup...' && " +
             "sleep 5 && " +
             "echo '📊 Container status:' && " +
             "docker ps --filter name=$CONTAINER_NAME --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' && " +
             "echo '📋 Recent logs:' && " +
             "docker logs --tail 20 --timestamps $CONTAINER_NAME"

ssh $HOSTNAME $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy complete!" -ForegroundColor Green
    Write-Host "🌐 Application should be available at: http://your-server:$PORT" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deploy failed!" -ForegroundColor Red
    Write-Host "🔍 Checking error details..." -ForegroundColor Yellow
    ssh $HOSTNAME "docker logs --tail 10 $CONTAINER_NAME 2>&1 || echo 'No container logs available'"
    exit 1
}
