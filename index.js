// init aaaaaaaaaaaaaaaaaaaaaaa
const fetch = require("node-fetch"),
    ora = require("ora"),
    apps = require("os").homedir() + "/.apps/",
    shell = require("shelljs"),
    { spawn } = require('child_process'),
    fs = require("fs");

// the actuyal code..
if (require("os").platform() != "linux") {
    console.error("This updater is for Linux only.");
    return process.exit(1);
};

let spinner = ora("Fetching latest release from pineappleEA/pineapple-src...");

fetch("https://api.github.com/repos/pineappleEA/pineapple-src/releases/latest").then(r => r.json()).then(json => {
    const asset = json.assets.filter(asset => asset.name.endsWith("AppImage"))[0];
    if (!asset) {
        spinner.fail("The Linux build is currently being bundled as an AppImage. Please try again later.");
        return process.exit(1);
    }
    
    let yuzuFolder = apps + "yuzu/",
        release = yuzuFolder + "release.json";

    // stealing code moment :)
    // https://stackoverflow.com/a/26815894

    if (!fs.existsSync(apps)) {
        fs.mkdirSync(apps);
        fs.mkdirSync(yuzuFolder);
    }

    if (fs.existsSync(release)) {
        const releaseJSON = JSON.parse(fs.readFileSync(release));
        if (releaseJSON.tag_name == json.tag_name) {
            spinner.succeed("You already have the latest release. Launching Yuzu...");
            spawn(`${yuzuFolder}yuzu.AppImage`, {
                stdio: 'ignore',
                detached: true
            }).unref();
            process.exit();
        }
    }

    fs.writeFileSync(release, JSON.stringify(json));
    spinner.succeed(`Fetched latest release. This is build ${json.tag_name}.`);
    spinner = ora("Downloading the latest Yuzu AppImage...");

    const file = fs.createWriteStream(yuzuFolder + "yuzu.AppImage");
    
    file.on("error", () => {
        spinner.fail("Please exit out of Yuzu.");
        process.exit(1);
    });

    fetch(asset.browser_download_url).then(r => {
        r.body.pipe(file);
        file.on("finish", () => {
            spinner.succeed(`Finished downloading latest release! It is stored at "${yuzuFolder}yuzu.AppImage". Launching Yuzu...`);
            shell.exec(`chmod a+x ${yuzuFolder}yuzu.AppImage`, () => {
                spawn(`${yuzuFolder}yuzu.AppImage`, {
                    stdio: 'ignore',
                    detached: true
                }).unref();
                process.exit();
            });
        });
    });
});