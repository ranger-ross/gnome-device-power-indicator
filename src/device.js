const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Logger = Me.imports.src.logger;

function getDevices() {
    const deviceNames = getDeviceNames();
    const devices = [];

    for (const device of deviceNames) {
        Logger.debug(`Collecting data for device ${device}`);

        const rawDeviceInfo = getDeviceInfo(device);
        const deviceInfo = parseDeviceInfo(rawDeviceInfo);

        Logger.debug(`Device info => ${JSON.stringify(deviceInfo)}`)

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
    Logger.info(`Parsing device info ` + rawDeviceInfo);

    const lines = rawDeviceInfo.split('\n');

    let device = {
        model: null,
        rechargeable: null,
        state: null,
        percentage: null,
        iconName: null,
        type: null,
    };

    for (const line of lines) {

        if (!line || line === '') {
            // empty line
            continue;
        }

        if (['unknown', 'mouse'].includes(line.trim())) {
            device.type = line.trim();
            continue;
        }

        if (!line.includes(':')) {
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
        Logger.error(utf8decoder.decode(new Uint8Array(err)));
        return null;
    }

    const output = utf8decoder.decode(new Uint8Array(out))
    //Logger.info(`${command} output => ${output}`);

    return output;
}