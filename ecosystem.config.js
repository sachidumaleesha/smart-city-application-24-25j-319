module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: '/home/ubuntu/smart-city-application-24-25j-319/client',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'backend',
      cwd: '/home/ubuntu/smart-city-application-24-25j-319/server',
      script: 'python3',
      args: 'server.py',
      env: {
        PYTHONPATH: '/home/ubuntu/smart-city-application-24-25j-319/server',
        FLASK_ENV: 'production',
        TF_ENABLE_ONEDNN_OPTS: '1',
        TF_CPP_MIN_LOG_LEVEL: '2'
      }
    }
  ]
} 