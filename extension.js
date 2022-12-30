const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Logger = Me.imports.src.logger;
const DeviceUtil = Me.imports.src.device;

let container;

let batteryCheckLoop = null;

// Properties: icon, label
let primaryDeviceSection = null;

function init() {
    Logger.info('Init extension');

    container = new Clutter.Actor({
        layout_manager: new Clutter.BoxLayout({
            spacing: 6,
        })
    });

    primaryDeviceSection = addDeviceSection();
}

function enable() {
    Logger.info('Enabling extension');

    batteryCheckLoop = Mainloop.timeout_add_seconds(2, () => {
        try {
            updateDeviceLoop();
        } catch (e) {
            Logger.error(e);
        }
        return true;
    });

    // Add the button to the panel
    Main.panel._rightBox.insert_child_at_index(container, 0);
}

function disable() {
    Logger.info('Disabling extension');
    if (batteryCheckLoop) {
        Mainloop.source_remove(batteryCheckLoop);
    }
    Main.panel._rightBox.remove_child(container);
}

/**
 * The primary update loop that checks the device state
 */
function updateDeviceLoop() {
    Logger.info('Checking devices');
    const devices = DeviceUtil.getDevices();

    for (const device of devices) {
        if (device?.model == 'G703 LIGHTSPEED Wireless Gaming Mouse w/ HERO') {
            Logger.info(device.model + ' ' + device.percentage);
            primaryDeviceSection.deviceIcon.icon_name = deviceTypeToIconName(device.type);
            primaryDeviceSection.label.text = device.percentage;
            primaryDeviceSection.batteryIcon.icon_name = device.iconName;
        }
    }
}

function deviceTypeToIconName(type) {
    return { // TODO: Support 
        'mouse': 'input-mouse-symbolic'
    }[type];
}

function createDeviceSection() {
    let deviceIcon = new St.Icon({
        // icon_name: 'battery-empty-symbolic',
        icon_name: 'input-mouse-symbolic',
        icon_size: 18,
        //style_class: 'system-status-icon',
    });


    let label = new St.Label({
        text: "",
        y_align: Clutter.ActorAlign.CENTER,
    });

    let batteryIcon = new St.Icon({
        // icon_name: 'battery-empty-symbolic',
        icon_name: 'input-mouse-symbolic',
        icon_size: 18,
        //style_class: 'system-status-icon',
    });

    return { label, batteryIcon, deviceIcon };
}
function addDeviceSection() {
    const { label, batteryIcon, deviceIcon } = createDeviceSection();
    container.add_child(deviceIcon);
    container.add_child(label);
    //container.add_child(batteryIcon);
    return { label, batteryIcon, deviceIcon };
}
