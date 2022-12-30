const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Logger = Me.imports.src.logger;

async function getDevices() {
    const deviceNames = await getDeviceNames();
    const devices = [];

    for (const device of deviceNames) {
        Logger.debug(`Collecting data for device ${device}`);

        const rawDeviceInfo = await getDeviceInfo(device);
        const deviceInfo = parseDeviceInfo(rawDeviceInfo);

        Logger.debug(`Device info => ${JSON.stringify(deviceInfo)}`)

        devices.push(deviceInfo);
    }

    return devices;
}

async function getDeviceInfo(device) {
    return await runCommand(`upower -i ${device}`);
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

        // TODO: Support other types like keyboard: https://upower.freedesktop.org/docs/Device.html
        if (['unknown', 'mouse', 'keyboard'].includes(line.trim())) {
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
            device.iconName = getPropertyValue(line).replaceAll("'", "");
        } else if (line.trim().startsWith('percentage')) {
            device.percentage = getPropertyValue(line);
        } else if (line.trim().startsWith('model')) {
            device.model = getPropertyValue(line);
        }

    }

    return device;
}

async function getDeviceNames() {
    const output = await runCommand(`upower -e`);
    return output
        .split('\n')
        .filter(line => !!line && line !== '');
}

async function runCommand(command) {
    return await execCommunicate(command.split(' '));
}

/**
 * Execute a command asynchronously and return the output from `stdout` on
 * success or throw an error with output from `stderr` on failure.
 *
 * If given, @input will be passed to `stdin` and @cancellable can be used to
 * stop the process before it finishes.
 *
 * @param {string[]} argv - a list of string arguments
 * @param {string} [input] - Input to write to `stdin` or %null to ignore
 * @param {Gio.Cancellable} [cancellable] - optional cancellable object
 * @returns {Promise<string>} - The process output
 */
async function execCommunicate(argv, input = null, cancellable = null) {
    let cancelId = 0;
    let flags = (Gio.SubprocessFlags.STDOUT_PIPE |
        Gio.SubprocessFlags.STDERR_PIPE);

    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;

    let proc = new Gio.Subprocess({
        argv: argv,
        flags: flags
    });
    proc.init(cancellable);

    if (cancellable instanceof Gio.Cancellable) {
        cancelId = cancellable.connect(() => proc.force_exit());
    }

    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(input, null, (proc, res) => {
            try {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                let status = proc.get_exit_status();

                if (status !== 0) {
                    throw new Gio.IOErrorEnum({
                        code: Gio.io_error_from_errno(status),
                        message: stderr ? stderr.trim() : GLib.strerror(status)
                    });
                }

                resolve(stdout.trim());
            } catch (e) {
                reject(e);
            } finally {
                if (cancelId > 0) {
                    cancellable.disconnect(cancelId);
                }
            }
        });
    });
}