const LOG_PREFIX = `[device-battery-indicator]`;
const ENABLE_LOGGING = false; // Disable before packaging

var logWithLevel = (level, msg) => {
    if (!ENABLE_LOGGING)
        return;
    log(`${new Date().toISOString()} ${LOG_PREFIX} ${level} ${msg}`);
}

var info = (msg) => logWithLevel(`INFO`, msg);
var warn = (msg) => logWithLevel(`WARN`, msg);
var debug = (msg) => logWithLevel(`DEBUG`, msg);
var error = (msg) => logWithLevel(`ERROR`, msg);
