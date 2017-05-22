const crypto = require('crypto');
const hash = crypto.createHash('sha256');
let tstart = new Date().getTime();
hash.update('aaa');
console.log(hash.digest('hex'));
console.log(new Date().getTime() - tstart);