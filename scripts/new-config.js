'use strict';

const randomUtil = require('./util/random-util.js');

const newConfig = {};
newConfig.aes256 = {};
newConfig.aes256.key = randomUtil.getRandomHex32();
newConfig.aes256.iv = randomUtil.getRandomHex16();

console.log('STARTED new config');
console.log(JSON.stringify(newConfig, undefined, '\t'));
console.log('SUCCESS new config');
