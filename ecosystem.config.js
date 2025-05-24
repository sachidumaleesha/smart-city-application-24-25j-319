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
        FLASK_ENV: 'production',
        TF_ENABLE_ONEDNN_OPTS: '1',
        TF_CPP_MIN_LOG_LEVEL: '2',
        VIRTUAL_ENV: '/home/ubuntu/smart-city-application-24-25j-319/server/venv',
        PATH: '/home/ubuntu/smart-city-application-24-25j-319/server/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
      }
    }
  ]
} 