// Example #1

const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;

let panelButton;

const LOG_PREFIX = `[device-battery-indicator]`;
const info = (msg) => log(`${LOG_PREFIX} INFO ${msg}`);
const warn = (msg) => log(`${LOG_PREFIX} WARN ${msg}`);
const debug = (msg) => log(`${LOG_PREFIX} DEBUG ${msg}`);
const error = (msg) => log(`${LOG_PREFIX} ERROR ${msg}`);

function init() {

    info('RossInit');

    // Create a Button with "Hello World" text
    panelButton = new St.Bin({
        style_class: "panel-button",
    });
    let panelButtonText = new St.Label({
        text: "Hello World",
        y_align: Clutter.ActorAlign.CENTER,
    });
    panelButton.set_child(panelButtonText);
}

function enable() {

    info('RossEnable2');

    getDevices();

    // Add the button to the panel
    Main.panel._rightBox.insert_child_at_index(panelButton, 0);
}

function disable() {
    info('RossDisable');
    // Remove the added button from panel
    Main.panel._rightBox.remove_child(panelButton);
}

function getDevices() {
    const deviceNames = getDeviceNames();

    const devices = [];

    for (const device of deviceNames) {
        info(`Collecting data for device ${device}`);

        const rawDeviceInfo = getDeviceInfo(device);
        const deviceInfo = parseDeviceInfo(rawDeviceInfo);

        info(`Device info => ${JSON.stringify(deviceInfo)}`)

        // TODO: Push device data to list
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