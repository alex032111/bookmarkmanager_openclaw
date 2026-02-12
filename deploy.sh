#!/bin/bash

# OpenClaw Backend Deployment Script for VM
# This script helps deploy OpenClaw backend on a Linux VM

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  OpenClaw Backend - VM Deployment Script            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Configuration
INSTALL_DIR="/opt/openclaw-backend"
SERVICE_USER="openclaw"
DEPLOYMENT_MODE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or use sudo"
    exit 1
fi

# Ask for deployment mode
echo "Choose deployment mode:"
echo "1) Docker (recommended)"
echo "2) Native Node.js with Systemd"
echo "3) Native Node.js with PM2"
read -p "Enter choice [1-3]: " mode_choice

case $mode_choice in
    1) DEPLOYMENT_MODE="docker" ;;
    2) DEPLOYMENT_MODE="systemd" ;;
    3) DEPLOYMENT_MODE="pm2" ;;
    *) print_error "Invalid choice"; exit 1 ;;
esac

echo ""
print_info "Deployment mode: $DEPLOYMENT_MODE"
print_info "Installation directory: $INSTALL_DIR"

# Update system
print_info "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install dependencies based on mode
if [ "$DEPLOYMENT_MODE" = "docker" ]; then
    print_info "Installing Docker and Docker Compose..."
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    else
        print_info "Docker already installed"
    fi
    
    # Install Docker Compose plugin
    if ! docker compose version &> /dev/null; then
        apt-get install -y docker-compose-plugin
    fi
    
    # Add current user to docker group
    usermod -aG docker $SUDO_USER
    
elif [ "$DEPLOYMENT_MODE" = "systemd" ] || [ "$DEPLOYMENT_MODE" = "pm2" ]; then
    print_info "Installing Node.js..."
    
    # Install Node.js 20
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        print_info "Node.js already installed: $(node -v)"
    fi
    
    # Create service user
    if ! id "$SERVICE_USER" &>/dev/null; then
        print_info "Creating service user: $SERVICE_USER"
        useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
    fi
    
    if [ "$DEPLOYMENT_MODE" = "pm2" ]; then
        print_info "Installing PM2 globally..."
        npm install -g pm2
    fi
fi

# Create installation directory
print_info "Creating installation directory..."
mkdir -p "$INSTALL_DIR"

# Copy files
print_info "Copying application files..."
cp -r ./* "$INSTALL_DIR/"

# Set permissions
if [ "$DEPLOYMENT_MODE" = "systemd" ] || [ "$DEPLOYMENT_MODE" = "pm2" ]; then
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/data"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/data"
fi

# Install dependencies
if [ "$DEPLOYMENT_MODE" = "systemd" ] || [ "$DEPLOYMENT_MODE" = "pm2" ]; then
    print_info "Installing Node.js dependencies..."
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" npm ci --production
fi

# Start service
if [ "$DEPLOYMENT_MODE" = "docker" ]; then
    print_info "Starting Docker containers..."
    cd "$INSTALL_DIR"
    docker compose up -d
    
    print_info "Checking container status..."
    sleep 5
    docker compose ps
    
elif [ "$DEPLOYMENT_MODE" = "systemd" ]; then
    print_info "Setting up systemd service..."
    cp "$INSTALL_DIR/openclaw-backend.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable openclaw-backend
    systemctl start openclaw-backend
    
    print_info "Checking service status..."
    systemctl status openclaw-backend --no-pager
    
elif [ "$DEPLOYMENT_MODE" = "pm2" ]; then
    print_info "Starting with PM2..."
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" pm2 start src/server.js --name openclaw-backend
    sudo -u "$SERVICE_USER" pm2 save
    sudo -u "$SERVICE_USER" pm2 startup systemd
    
    print_info "Checking PM2 status..."
    sudo -u "$SERVICE_USER" pm2 status
fi

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    print_info "Configuring firewall..."
    ufw allow 3000/tcp
fi

echo ""
print_info "Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test the API: curl http://localhost:3000/health"
echo "2. Access the API documentation: http://<VM-IP>:3000"
echo "3. For production, configure reverse proxy (see nginx.conf)"
echo ""
print_info "API is running on port 3000"