#!/bin/bash

# Install v4l2loopback for virtual camera
sudo apt-get update
sudo apt-get install -y v4l2loopback-dkms

# Load the v4l2loopback module
sudo modprobe v4l2loopback

# Create virtual video device
sudo modprobe v4l2loopback devices=1 video_nr=0 card_label="Virtual Camera" exclusive_caps=1

# Increase system memory limits
echo "vm.overcommit_memory=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Create directory for video frames if it doesn't exist
mkdir -p /home/ubuntu/smart-city-application-24-25j-319/server/frames

# Set proper permissions
sudo chmod 777 /dev/video0 || true 