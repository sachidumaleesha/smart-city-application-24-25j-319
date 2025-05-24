#!/bin/bash

# Update package list
sudo apt-get update

# Install system dependencies for OpenCV
sudo apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgtk-3-0

# Install Python development files
sudo apt-get install -y python3-dev

# Install additional dependencies for video processing
sudo apt-get install -y \
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev

# Make the script executable
chmod +x setup_dependencies.sh 