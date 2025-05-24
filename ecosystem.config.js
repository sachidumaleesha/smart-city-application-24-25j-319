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
      script: '/home/ubuntu/smart-city-application-24-25j-319/server/venv/bin/python3',
      args: 'server.py',
      interpreter: 'none',
      env: {
        PYTHONPATH: '/home/ubuntu/smart-city-application-24-25j-319/server',
        FLASK_ENV: 'production'
      }
    }
  ]
} 