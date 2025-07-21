module.exports = [
  {
    path: 'build/static/js/*.js',
    limit: '500 KB',
    webpack: false,
    name: 'JS Bundle',
  },
  {
    path: 'build/static/css/*.css',
    limit: '100 KB',
    webpack: false,
    name: 'CSS Bundle',
  },
  {
    path: 'build/**/*.{js,css}',
    limit: '700 KB',
    webpack: false,
    name: 'Total Bundle',
  },
  {
    path: 'build/index.html',
    limit: '10 KB',
    webpack: false,
    name: 'HTML',
  },
  {
    path: 'build/**/*',
    limit: '2 MB',
    webpack: false,
    name: 'Total Build Size',
  },
];
