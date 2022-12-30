const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

/**
 * @typedef {Object} Device
 * @property {string} model - The model name
 * @property {boolean} rechargeable - Is the device rechargable
 * @property {string} state - The power state of the device
 * @property {string} percentage - The power percentage as a string ie. '100%'
 * @property {string} iconName - The icon name
 */

let panelButton;

const LOG_PREFIX = `[device-battery-indicator]`;
const logWithLevel = (level, msg) => log(`${new Date().toISOString()} ${LOG_PREFIX} ${level} ${msg}`);
const info = (msg) => logWithLevel(`INFO`, msg);
const warn = (msg) => logWithLevel(`WARN`, msg);
const debug = (msg) => logWithLevel(`DEBUG`, msg);
const error = (msg) => logWithLevel(`ERROR`, msg);

let batteryCheckLoop = null;

let panelButtonText = new St.Label({
    text: "Hello World",
    y_align: Clutter.ActorAlign.CENTER,
});

function init() {
    info('Init extension');

    // Create a Button with "Hello World" text
    panelButton = new St.Bin({
        style_class: "panel-button",
    });

    panelButton.set_child(panelButtonText);
}

function enable() {
    info('Enabling extension');

    batteryCheckLoop = Mainloop.timeout_add_seconds(2, () => {
        try {
            updateDeviceLoop();
        } catch (e) {
            error(e);
        }
        return true;
    });

    // Add the button to the panel
    Main.panel._rightBox.insert_child_at_index(panelButton, 0);
}

function disable() {
    info('Disabling extension');
    if (batteryCheckLoop) {
        Mainloop.source_remove(batteryCheckLoop);
    }
    Main.panel._rightBox.remove_child(panelButton);
}

/**
 * The primary update loop that checks the device state
 */
function updateDeviceLoop() {
    info('Checking devices');
    const devices = getDevices();

    for (const device of devices) {

        if (device?.model == 'G703 LIGHTSPEED Wireless Gaming Mouse w/ HERO') {
            info(device.model + ' ' + device.percentage);

            panelButtonText.text = device.model + ' ' + device.percentage;
        }

    }

}

function getDevices() {
    const deviceNames = getDeviceNames();
    const devices = [];

    for (const device of deviceNames) {
        debug(`Collecting data for device ${device}`);

        const rawDeviceInfo = getDeviceInfo(device);
        const deviceInfo = parseDeviceInfo(rawDeviceInfo);

        debug(`Device info => ${JSON.stringify(deviceInfo)}`)

        devices.push(deviceInfo);
    }

    return devices;
}

function getDeviceInfo(device) {
    return runCommand(`upower -i ${device}`);
}

function getPropertyValue(property) {
    return property.substring(property.indexOf(':') + 1).trim();
}

/**
 * Returns true of a line contains yes (for output of upower -d)
 * 
 * Example:
 * mouse
 *   present:             yes
 *   rechargeable:        yes
 */
function isYes(property) {
    return getPropertyValue(property).includes('yes');
}

/**
 * Convert the raw upower string output to a javascript object.
 * 
 * @returns {Device}
 */
function parseDeviceInfo(rawDeviceInfo) {
    info(`Parsing device info ` + rawDeviceInfo);


    const lines = rawDeviceInfo.split('\n');

    let device = {
        model: null,
        rechargeable: null,
        state: null,
        percentage: null,
        iconName: null,
    };

    for (const line of lines) {

        if (!line || line === '' || !line.includes(':')) {
            // non-property line, skip it
            continue;
        }

        if (line.trim().startsWith('rechargeable')) {
            device.rechargeable = isYes(line);
        } else if (line.trim().startsWith('state')) {
            device.state = getPropertyValue(line);
        } else if (line.trim().startsWith('icon-name')) {
            device.iconName = getPropertyValue(line);
        } else if (line.trim().startsWith('percentage')) {
            device.percentage = getPropertyValue(line);
        } else if (line.trim().startsWith('model')) {
            device.model = getPropertyValue(line);
        }

    }

    return device;
}

function getDeviceNames() {
    const output = runCommand(`upower -e`);
    return output
        .split('\n')
        .filter(line => !!line && line !== '');
}

function runCommand(command) {
    const utf8decoder = new TextDecoder();
    const [ok, out, err, exit] = GLib.spawn_command_line_sync(command);

    if (!ok) {
        error(utf8decoder.decode(new Uint8Array(err)));
        return null;
    }

    const output = utf8decoder.decode(new Uint8Array(out))
    //info(`${command} output => ${output}`);

    return output;
}