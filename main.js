// init
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    globalShortcut
} = require("electron"), {
        download
    } = require("electron-dl"), {
        join
    } = require("path"),
    fetch = require("node-fetch"),
    settings = require("electron-settings"),
    homeFolder = require("os").homedir(),
    {resolve} = require("path"),
    createDesktopShortcut = require('create-desktop-shortcuts'),
    { exec } = require('child_process'),
    fs = require("fs");
    app.commandLine.appendSwitch('disable-pinch');
// actual code

async function releases() {
    const r = await fetch("https://api.github.com/repos/pineappleea/pineapple-src/git/refs/tags")
    let json = await r.json()
    json.splice(0, 10);
    json = json.reverse();
    json.shift(); // remove continuous
    json.forEach((elem, index) => {
        json[index] = {
            "version": elem.ref.replace("refs/tags/", ""),
            "url": `${elem.url.replace("api.", "").replace("repos/", "").replace("git/refs/tags/", "releases/download/")}/${elem.ref.replace("refs/tags/", "Yuzu-")}.AppImage`
        }
    })
    return JSON.stringify(json);
}

function createWindow() {
    const win = new BrowserWindow({
        icon: __dirname + "/public/img/ea.png",
        width: 1280,
        height: 480,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            devTools: false,
            preload: join(__dirname, "preload.js")
        }
    })

    win.loadFile("./public/index.html")

    win.setResizable(false)

    ipcMain.on("download", async (event, args) => {
        if (args.save == "default") {
            if (!fs.existsSync(homeFolder + "/.apps/yuzu/"))  fs.mkdirSync(homeFolder + "/.apps/yuzu/", { recursive: true });
            args.save = homeFolder + "/.apps/yuzu/" 
        }
        if (settings.getSync("keys")) {
            if (!fs.existsSync(homeFolder + "/.local/share/yuzu/keys/")) fs.mkdirSync(homeFolder + "/.local/share/yuzu/keys/", { recursive: true });
            await download(BrowserWindow.getFocusedWindow(), "https://raw.githubusercontent.com/emuworld/aio/master/prod.keys", {
                "directory": homeFolder + "/.local/share/yuzu/keys/",
                "filename": "prod.keys",
                "onProgress": p => {
                    event.reply("dlMessage", "keys")
                    event.reply("percent", p)
                }
            })
        }
        if (!args.save.endsWith("/")) args.save += "/";
        download(BrowserWindow.getFocusedWindow(), args.url, {
            "directory": args.save,
            "filename": "yuzu.AppImage",
            "onProgress": p => {
                event.reply("dlMessage", "yuzu Early Access")
                event.reply("percent", p)
            }
        }).then(dl => {
            exec(`chmod +x ${dl.getSavePath()}`)
            exec(`cp ${__dirname}/public/img/ea.png ${args.save}/ea.png`, ()=>{
                let desktopShortcut = createDesktopShortcut({
                    linux: { 
                        icon: args.save+"ea.png",
                        type: 'Application',
                        terminal: false,
                        chmod: true,
                        name: 'yuzu Early Access',
                        filePath: args.save+"yuzu.AppImage" 
                    }
                }),
                shortcut = createDesktopShortcut({
                    linux: { 
                        outputPath: homeFolder + "/.local/share/applications/",
                        icon: args.save+"ea.png",
                        type: 'Application',
                        terminal: false,
                        chmod: true,
                        name: 'yuzu Early Access',
                        filePath: args.save+"yuzu.AppImage" 
                    }
                })
                
                if (desktopShortcut && shortcut) event.reply("finished", dl.getSavePath());
            })
        });
    });

    ipcMain.on("releases", (event) => {
        releases().then(releases => event.reply("releases", releases))
    })

    ipcMain.on("selectFolder", async event => {
        const result = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        })
        event.reply("folder", result.filePaths)
    })

    ipcMain.on("homeFolder", event => {
        event.reply("homeFolder", homeFolder)
    });

    ipcMain.on("save", (_, args) => {
        args = JSON.parse(args)
        settings.setSync("url", args.url)
        settings.setSync("save", args.save)
        settings.setSync("latest", args.latest)
        settings.setSync("keys", args.keys)
    })

    ipcMain.on("getSettings", async event => {
        let url = settings.getSync("url"),
            save = settings.getSync("save"),
            latest = settings.getSync("latest"),
            keys = settings.getSync("keys");
        if (!url && !save && !latest && !keys) {
            settings.setSync("url", "")
            settings.setSync("save", "default")
            settings.setSync("latest", true)
            settings.setSync("keys", true)
        }
        event.reply("settings", JSON.stringify({
            url: url,
            save: save,
            latest: latest,
            keys: keys
        }))
    })

    ipcMain.on("exit", () => {
        app.exit(0);
    })
}

app.whenReady().then(() => {
    createWindow()
    globalShortcut.register('Control+Shift+I', () => { return false })
})