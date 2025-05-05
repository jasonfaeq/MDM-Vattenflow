#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y python3 python3-pip wine-stable

# Install Python packages
pip3 install fastapi uvicorn xlwings

# Create service directory
sudo mkdir -p /opt/excel_service
sudo mkdir -p /opt/excel_service/templates

# Copy service files
sudo cp excel_export_service.py /opt/excel_service/
sudo cp templates/wbs_template_actual.xlsm /opt/excel_service/templates/

# Create systemd service
sudo tee /etc/systemd/system/excel-service.service << EOF
[Unit]
Description=Excel Export Service
After=network.target

[Service]
User=root
WorkingDirectory=/opt/excel_service
ExecStart=/usr/bin/python3 excel_export_service.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable excel-service
sudo systemctl start excel-service

# Configure firewall
sudo ufw allow 8000/tcp 