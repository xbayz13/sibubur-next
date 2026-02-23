/**
 * PM2 Ecosystem Configuration for SiBubur Frontend
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [{
    name: 'sibubur-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3031',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3031,
      // NEXT_PUBLIC_API_URL sudah di-set saat build time
      // Next.js akan embed value ini ke dalam bundle
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3031,
      // NEXT_PUBLIC_API_URL sudah di-set saat build time
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
  }]
};

