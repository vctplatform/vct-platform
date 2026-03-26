const fs = require('fs');
const errs = fs.readFileSync('build_errors.txt', 'utf16le');
console.log(errs.substring(0, 3000));
