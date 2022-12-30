const LOG_PREFIX = `[device-battery-indicator]`;

var logWithLevel = (level, msg) => log(`${new Date().toISOString()} ${LOG_PREFIX} ${level} ${msg}`);

var info = (msg) => logWithLevel(`INFO`, msg);
var warn = (msg) => logWithLevel(`WARN`, msg);
var debug = (msg) => logWithLevel(`DEBUG`, msg);
var error = (msg) => logWithLevel(`ERROR`, msg);
