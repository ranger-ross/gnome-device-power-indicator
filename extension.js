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
let mouseDeviceSection = createDeviceSection();
let keyboardDeviceSection = createDeviceSection();

function init() {
    Logger.info('Init extension');

    container = new Clutter.Actor({
        layout_manager: new Clutter.BoxLayout({
            spacing: 6,
        })
    });

    //addDeviceSection(mouseDeviceSection);
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

    addMouseDevice(devices);
    addKeyboardDevice(devices);
}

function addMouseDevice(devices) {
    const mouseDevice = devices.find(device => device?.type == 'mouse');
    if (mouseDevice) {
        mouseDeviceSection.deviceIcon.icon_name = deviceTypeToIconName(mouseDevice.type);
        mouseDeviceSection.label.text = mouseDevice.percentage;
        addDeviceSection(mouseDeviceSection);
    } else {
        removeDeviceSection(mouseDeviceSection);
    }
}

function addKeyboardDevice(devices) {
    const keyboardDevice = devices.find(device => device?.type == 'keyboard');
    if (keyboardDevice) {
        keyboardDeviceSection.deviceIcon.icon_name = deviceTypeToIconName(keyboardDevice.type);
        keyboardDeviceSection.label.text = keyboardDevice.percentage;
        addDeviceSection(keyboardDeviceSection);
    } else {
        removeDeviceSection(keyboardDeviceSection);
    }
}

// Icons stored in /usr/share/icons
function deviceTypeToIconName(type) {
    return {
        'mouse': 'input-mouse-symbolic',
        'keyboard': 'input-keyboard-symbolic',
    }[type];
}

function createDeviceSection() {
    const deviceIcon = new St.Icon({
        icon_name: 'input-mouse-symbolic',
        icon_size: 18,
    });

    const label = new St.Label({
        text: "",
        y_align: Clutter.ActorAlign.CENTER,
    });

    return { label, deviceIcon };
}

function addDeviceSection(deviceSection) {
    if (!container.contains(deviceSection.deviceIcon)) {
        container.add_child(deviceSection.deviceIcon);
    }
    if (!container.contains(deviceSection.label)) {
        container.add_child(deviceSection.label);
    }
}

function removeDeviceSection(deviceSection) {
    container.remove_child(deviceSection.deviceIcon);
    container.remove_child(deviceSection.label);
}
