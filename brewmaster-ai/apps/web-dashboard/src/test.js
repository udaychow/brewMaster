// Test file resolution
const fs = require('fs');
const path = require('path');

console.log('Current directory:', __dirname);
console.log('Files in directory:', fs.readdirSync(__dirname));
console.log('App.tsx exists?', fs.existsSync(path.join(__dirname, 'App.tsx')));