'use strict';
// libraries
const fs = require('fs');

// modules
const dateUtil = require('./util/date-util.js');
const randomUtil = require('./util/random-util.js');
const webServerUtil = require('./web/server-util.js');

// constants
const config = require('./config.json');
const configOverride = require('../config.json');

const modules = [];

const loggingUtil = {};
loggingUtil.log = console.log;
loggingUtil.isDebugEnabled = () => {
  return false;
};
loggingUtil.debug = () => {};
// loggingUtil.debug = console.log;
loggingUtil.trace = console.trace;

const init = async () => {
  loggingUtil.log(dateUtil.getDate(), 'STARTED init');

  overrideConfig();

  if (config.aes256.key == '') {
    throw Error(`aes256.key is required in ./config.json run 'npm run new-config;'`);
  }
  if (config.aes256.iv == '') {
    throw Error(`aes256.key is required in ./config.json run 'npm run new-config;'`);
  }

  fs.mkdirSync(config.dataDir, {recursive: true});

  modules.push(dateUtil);
  modules.push(randomUtil);
  modules.push(webServerUtil);

  for (let moduleIx = 0; moduleIx < modules.length; moduleIx++) {
    const item = modules[moduleIx];
    await item.init(config, loggingUtil);
  }

  webServerUtil.setCloseProgramFunction(closeProgram);

  process.on('SIGINT', closeProgram);

  loggingUtil.log(dateUtil.getDate(), 'SUCCESS init');
};

const deactivate = async () => {
  loggingUtil.log(dateUtil.getDate(), 'STARTED deactivate');
  const reverseModules = modules.slice().reverse();
  for (let moduleIx = 0; moduleIx < reverseModules.length; moduleIx++) {
    const item = reverseModules[moduleIx];
    await item.deactivate(config, loggingUtil);
  }
  loggingUtil.log(dateUtil.getDate(), 'SUCCESS deactivate');
};

const closeProgram = async () => {
  console.log('STARTED closing program.');
  await deactivate();
  console.log('SUCCESS closing program.');
  process.exit(0);
};

const isObject = function(obj) {
  return (!!obj) && (obj.constructor === Object);
};

const overrideValues = (src, dest) => {
  Object.keys(src).forEach((key) => {
    const srcValue = src[key];
    const destValue = dest[key];
    if (isObject(destValue)) {
      overrideValues(srcValue, destValue);
    } else {
      dest[key] = srcValue;
    }
  });
};

const overrideConfig = () => {
  loggingUtil.debug('STARTED overrideConfig', config);
  overrideValues(configOverride, config);

  for (let aesopImageIx = 0; aesopImageIx < config.maxAesopImage; aesopImageIx++) {
    const aesopImage = aesopImages[aesopImageIx];
    for (let descriptionIx = 0; descriptionIx < aesopImage.description.length; descriptionIx++) {
      const description = aesopImage.description[descriptionIx];
      const st = {};
      st.id = `${aesopImage.title} ${descriptionIx+1}`;
      st.id = st.id.split(' ').join('_').split(`'`).join('_').split(`,`).join('_');
      // console.log('st.id', st.id);
      st.size = 300;
      st.description = description + '(full scene with jungle volcano background)';
      st.showDescription = true;
      st.inDrawing = true;
      config.submissionTypes.push(st);
    }
  }

  loggingUtil.debug('SUCCESS overrideConfig', config);
};

init()
    .catch((e) => {
      console.log('FAILURE init.', e.message);
      console.trace('FAILURE init.', e);
    });
