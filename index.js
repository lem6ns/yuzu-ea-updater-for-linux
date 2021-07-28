// init aaaaaaaaaaaaaaaaaaaaaaa
const fetch = require("node-fetch"),
    ora = require("ora"),
    apps = require("os").homedir() + "/.apps/",
    shell = require("shelljs"),
    config = require("./config.json"),
    Progress = require("node-fetch-progress"),
    { spawn } = require('child_process'),
    fs = require("fs");

// the actuyal code..
if (require("os").platform() != "linux") {
    console.error("This updater is for Linux only.");
    return process.exit(1);
};

let spinner = ora(`Fetching the ${config.version} release from pineappleEA/pineapple-src...`).start(),
url = "https://api.github.com/repos/pineappleEA/pineapple-src/releases/";

if (config.version.startsWith("EA-")) url = url+"tags/";

function launchYuzu(yuzuFolder) {
    spawn(`${yuzuFolder}yuzu.AppImage`, {
        stdio: 'ignore',
        detached: true
    }).unref();
    process.exit();
}

fetch(url+config.version).then(r => r.json()).then(json => {
    const asset = json.assets.filter(asset => asset.name.endsWith("AppImage"))[0];
    if (!asset) {
        spinner.fail("This build doesn't have an AppImage. If this is the latest release, try again later. If this is an older one, get a different build.");
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
            spinner.succeed(`You already have the ${config.version} release. Launching Yuzu...`);
            launchYuzu(yuzuFolder);
        }
    }

    fs.writeFileSync(release, JSON.stringify(json));
    spinner.succeed(`Fetched the release. This is build ${json.tag_name}.`);
    spinner = ora(`Downloading the ${config.version} Yuzu AppImage...`).start();

    const file = fs.createWriteStream(yuzuFolder + "yuzu.AppImage");
    
    file.on("error", () => {
        spinner.fail("Please exit out of Yuzu.");
        process.exit(1);
    });

    fetch(asset.browser_download_url).then(r => {
        const progress = new Progress(r)
        progress.on('progress', (p) => {
            spinner.text = `${Math.round(p.progress*100)}% downloaded | ETA: ${p.etah}`;
        })
        r.body.pipe(file);
        file.on("finish", () => {
            spinner.succeed(`Finished downloading the ${config.version} release! It is stored at "${yuzuFolder}yuzu.AppImage". Launching Yuzu...`);
            shell.exec(`chmod a+x ${yuzuFolder}yuzu.AppImage`, () => {
                setTimeout(()=>{
                    launchYuzu(yuzuFolder);
                },250)
            });
        });
    });
});