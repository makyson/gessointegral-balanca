module.exports = {
  apps: [{
    name: 'balanca',
    script: 'index.js',
  }],
  deploy: {
    production: {
      key: '~/.ssh/iosley.pem',
      user: 'seges',
      host: [{ host: '177.67.95.238 -p 422' }],
      ref: 'origin/master',
      repo: 'git@github.com:iosley/gessointegral-balanca.git',
      path: '/srv/balanca',
      'post-deploy': 'npm i --no-save && pm2 restart ecosystem.config.js ',
    },
  },
};