var jwt = require('jsonwebtoken');
const config = require('./config');

let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2RlcklkIjoiNTkyMzM1MWFmYjI1NTY3YWEzNzhmOGU4IiwiaWF0IjoxNDk1NDc5NTc4LCJhdWQiOiIxMjM0NTY3ODkifQ.bgNkXjL6P6hwXvdoLHuSFw6OW_g8G9NWeYvPSWBnGfU';

let data = jwt.verify(token, config.tokenSecret, {audience: '123456789'});

console.log(data);
