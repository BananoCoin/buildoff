'use strict';

const randomUtil = require('./util/random-util.js');

const newConfig = {};
newConfig.cookieSecret = randomUtil.getRandomHex16();

console.log('STARTED new config');
console.log(JSON.stringify(newConfig, undefined, '\t'));
console.log('SUCCESS new config');
