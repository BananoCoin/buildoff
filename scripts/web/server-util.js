'use strict';
// libraries
const http = require('http');
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// modules
const dateUtil = require('../util/date-util.js');

// constants
const algorithm = 'aes256';

const AESCrypt = {};
AESCrypt.decrypt = (cryptkey, iv, encryptdata) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', cryptkey, iv);
  return Buffer.concat([
    decipher.update(Buffer.from(encryptdata, 'hex')),
    decipher.final(),
  ]);
};

AESCrypt.encrypt = (cryptkey, iv, cleardata) => {
  const encipher = crypto.createCipheriv('aes-256-cbc', cryptkey, iv);
  return Buffer.concat([
    encipher.update(Buffer.from(cleardata, 'hex')),
    encipher.final(),
  ]).toString('hex');
};

// variables
let config;
let loggingUtil;
let instance;
let closeProgramFn;
let iv;
let key;

// functions
const init = async (_config, _loggingUtil) => {
  /* istanbul ignore if */
  if (_config === undefined) {
    throw new Error('config is required.');
  }
  /* istanbul ignore if */
  if (_loggingUtil === undefined) {
    throw new Error('loggingUtil is required.');
  }
  config = _config;
  loggingUtil = _loggingUtil;

  iv = Buffer.from(config.aes256.iv, 'hex');
  key = Buffer.from(config.aes256.key, 'hex');

  {
    // const cryptkey = crypto.createHash('sha256').update('Nixnogen').digest();
    // const iv = Buffer.from('a2xhcgAAAAAAAAAA');
    const buf = Buffer.from('Here is some data for the encrypt'); // 32 chars
    const enc = AESCrypt.encrypt(key, iv, buf);
    const dec = AESCrypt.decrypt(key, iv, enc);

    console.warn('encrypt length: ', enc.length);
    console.warn('encrypt in Base64:', enc.toString('base64'));
    console.warn('decrypt all: ' + dec.toString('utf8'));
  }


  await initWebServer();
};

const deactivate = async () => {
  config = undefined;
  loggingUtil = undefined;
  closeProgramFn = undefined;
  iv = undefined;
  key = undefined;
  instance.close();
};

const initWebServer = async () => {
  const app = express();

  app.engine('.hbs', exphbs({extname: '.hbs',
    defaultLayout: 'main'}));
  app.set('view engine', '.hbs');

  app.use(express.static('static-html'));
  app.use(express.urlencoded({
    limit: '50mb',
    extended: true,
  }));
  app.use(bodyParser.json({
    limit: '50mb',
    extended: true,
  }));
  app.use((err, req, res, next) => {
    if (err) {
      loggingUtil.log(dateUtil.getDate(), 'error', err.message, err.body);
      res.send('');
    } else {
      next();
    }
  });

  app.use(cookieParser(config.cookieSecret));

  app.post('/', async (req, res) => {
    // loggingUtil.log(dateUtil.getDate(), '/', 'req.body', req.body);
    let valid = true;
    if (req.body.projectName === undefined) {
      loggingUtil.log(dateUtil.getDate(), '/', 'bad', 'projectName');
      valid = false;
    }
    if (req.body.projectDescription === undefined) {
      loggingUtil.log(dateUtil.getDate(), '/', 'bad', 'projectDescription');
      valid = false;
    }
    if (req.body.projectContactInfo === undefined) {
      loggingUtil.log(dateUtil.getDate(), '/', 'bad', 'projectContactInfo');
      valid = false;
    }
    if (req.body.projectBananoAccount === undefined) {
      loggingUtil.log(dateUtil.getDate(), '/', 'bad', 'projectBananoAccount');
      valid = false;
    }
    loggingUtil.log(dateUtil.getDate(), '/', 'valid', valid);
    if (valid) {
      const dataJson = {};
      dataJson.projectName = req.body.projectName;
      dataJson.projectDescription = req.body.projectDescription;
      dataJson.projectContactInfo = req.body.projectContactInfo;
      dataJson.projectBananoAccount = req.body.projectBananoAccount;
      if (fs.existsSync(config.dataDir)) {
        const rawFileData = JSON.stringify(dataJson);
        const encryptedData = AESCrypt.encrypt(key, iv, Buffer.from(rawFileData, 'utf-8'));
        const fileNm = crypto.createHash('sha256')
            .update(rawFileData)
            .digest().toString('hex');
        const filePath = path.join(config.dataDir, fileNm);
        loggingUtil.log(dateUtil.getDate(), '/', 'fileData', encryptedData);
        loggingUtil.log(dateUtil.getDate(), '/', 'filePath', filePath);
        const filePtr = fs.openSync(filePath, 'w');
        fs.writeSync(filePtr, encryptedData);
        fs.closeSync(filePtr);
      }
    }
    res.redirect(302, '/');
  });

  app.get('/', async (req, res) => {
    const data = {};

    data.projects = [];

    fs.mkdirSync(config.dataDir, {recursive: true});
    if (fs.existsSync(config.dataDir)) {
      fs.readdirSync(config.dataDir).forEach((fileNm) => {
        const filePath = path.join(config.dataDir, fileNm);
        const rawFileData = fs.readFileSync(filePath, 'utf-8');
        const decryptedData = AESCrypt.decrypt(key, iv, rawFileData);
        const fileJson = JSON.parse(decryptedData);
        const json = {};
        json.name = fileJson.projectName;
        json.description = fileJson.projectDescription;
        data.projects.push(json);
      });
    }

    res.render('buildoff', data);
  });


  app.get('/favicon.ico', async (req, res) => {
    res.redirect(302, '/favicon-16x16.png');
  });

  app.post('/favicon.ico', async (req, res) => {
    res.redirect(302, '/favicon.ico');
  });

  app.use((req, res, next) => {
    res.status(404);
    res.type('text/plain;charset=UTF-8').send('');
  });

  const server = http.createServer(app);

  instance = server.listen(config.web.port, (err) => {
    if (err) {
      loggingUtil.error(dateUtil.getDate(), 'buildoff ERROR', err);
    }
    loggingUtil.log(dateUtil.getDate(), 'buildoff listening on PORT', config.web.port);
  });

  const io = require('socket.io')(server);
  io.on('connection', (socket) => {
    socket.on('npmStop', () => {
      socket.emit('npmStopAck');
      socket.disconnect(true);
      closeProgramFn();
    });
  });
};

const setCloseProgramFunction = (fn) => {
  closeProgramFn = fn;
};

// exports
module.exports.init = init;
module.exports.deactivate = deactivate;
module.exports.setCloseProgramFunction = setCloseProgramFunction;
