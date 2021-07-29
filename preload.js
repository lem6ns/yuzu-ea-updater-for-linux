const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
        send: (channel, data) => {
            let validChannels = ["download", "releases", "selectFolder", "homeFolder", "save", "getSettings", "exit"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["percent", "finished", "releases", "folder", "homeFolder", "settings"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);