# Gnome Device Battery Indicator

A simple Gnome extension that displays device battery percentages in the Gnome menu bar. 

## Mouse
![](./readme-images/mouse.png)

## Keyboard

![](./readme-images/keyboard.png)

## Mouse and Keyboard

![](./readme-images/mouse-and-keyboard.png)

Currently supported device types:
- mouse
- keyboard


**Note**: The device power data is collected from the `upower` cli tool, so if your device is not listed it will not be shown by this extension. Please check that your device is being list there before openning an issue.

Please feel free to open issues/pull requests for bug fixes and/or new features.

<details>
<summary>Development</summary>

To see the logs

```sh
journalctl -f -o cat /usr/bin/gnome-shell
```

</details>