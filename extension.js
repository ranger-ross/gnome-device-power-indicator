const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Logger = Me.imports.src.logger;
const DeviceUtil = Me.imports.src.device;

let panelButton;

let batteryCheckLoop = null;

let panelButtonText = new St.Label({
    text: "Hello World",
    y_align: Clutter.ActorAlign.CENTER,
});

function init() {
    Logger.info('Init extension');

    // Create a Button with "Hello World" text
    panelButton = new St.Bin({
        style_class: "panel-button",
    });

    panelButton.set_child(panelButtonText);
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
    Main.panel._rightBox.insert_child_at_index(panelButton, 0);
}

function disable() {
    Logger.info('Disabling extension');
    if (batteryCheckLoop) {
        Mainloop.source_remove(batteryCheckLoop);
    }
    Main.panel._rightBox.remove_child(panelButton);
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

            panelButtonText.text = device.model + ' ' + device.percentage;
        }
    }
}

