#!/bin/bash

# Create swap file if it doesn't exist
if [ ! -f /swapfile ]; then
    echo "Creating swap file..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Optimize memory settings
echo "Optimizing memory settings..."
echo "vm.swappiness=60" | sudo tee -a /etc/sysctl.conf
echo "vm.overcommit_memory=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure TensorFlow to use memory growth
echo "Configuring TensorFlow memory growth..."
cat > memory_config.py << EOL
import tensorflow as tf
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)
EOL

# Create dummy video device if not exists
if [ ! -e /dev/video0 ]; then
    echo "Setting up dummy video device..."
    sudo modprobe v4l2loopback
fi

# Create necessary directories
mkdir -p frames
mkdir -p logs
mkdir -p models

# Set environment variables
echo "export TF_FORCE_GPU_ALLOW_GROWTH=true" >> ~/.bashrc
echo "export TF_CPP_MIN_LOG_LEVEL=2" >> ~/.bashrc
source ~/.bashrc

echo "Optimization complete. Please restart your application." 