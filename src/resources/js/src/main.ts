interface Settings {
    customPath?: boolean,
    path: string,
    keys: boolean,
    version: string
}

interface Release {
    version: string,
    url: string
};

declare let Neutralino: any;

async function getReleases(): Promise<Release[]> {
    const releases = [];
    const resp = await fetch("https://api.github.com/repos/pineappleea/pineapple-src/git/refs/tags");
    const tags = await resp.json();

    tags.splice(0, 10); // get rid of the first 10 releases to pineappleea/pineapple-src due to having no AppImage
    tags.reverse(); // reverse array so it is sorted from newest to oldest
    tags.shift(); // remove the continuous tag because that doesn't matter

    for (const tag of tags) {
        releases.push({
            "version": tag.ref.replace("refs/tags/", ""),
            "url": `${tag.url.replace("api.", "").replace("repos/", "").replace("git/refs/tags/", "releases/download/")}/${tag.ref.replace("refs/tags/", "Yuzu-")}.AppImage` // ex. https://api.github.com/repos/pineappleEA/pineapple-src/git/refs/tags/EA-2426 -> https://github.com/pineappleEA/pineapple-src/releases/download/EA-2426/Yuzu-EA-2426.AppImage
        });
    };

    return releases;
}

async function download(type: string, settings: Settings): Promise<void> {
    const progressBar: HTMLDivElement = document.querySelector("#progress");

    switch (type) {
        case "AppImage":
            const releases = await getReleases();
            let release: Release = releases.find(release => release.version == settings.version);
            if (settings.version == "latest")
                release = releases[0];

            const response = await fetch(`https://fuckcors.app/${release.url}`); // have to use cors proxy until neutralino can bypass cors
            const contentLength = response.headers.get('content-length'); // https://stackoverflow.com/a/64123890
            const total = parseInt(contentLength, 10);
            let loaded = 0;

            const res = new Response(new ReadableStream({
                async start(controller) {
                    const reader = response.body.getReader();
                    for (; ;) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        loaded += value.byteLength;
                        progressBar.style.width = `${Math.round(loaded / total * 100)}%`;
                        controller.enqueue(value);
                    }
                    controller.close();
                }
            }));
            const blob = await res.blob();

            await Neutralino.filesystem.writeBinaryFile(`${settings.path}/yuzu.AppImage`, blob.arrayBuffer());
            break;
        case "keys":
            const response1 = await fetch("https://z.zz.fo/M6j0N.keys");
            progressBar.style.width = `${Math.round(loaded / total * 100)}%`;
            const keys = response1.text();

            await Neutralino.filesystem.writeFile(`${await Neutralino.os.getEnv("HOME")}/.local/share/yuzu/keys/prod.keys`, keys);
            break;
    }
    return;
}

const settings = {
    get: async (): Promise<Settings> => {
        let settings: Settings = {
            "customPath": false,
            "path": `${await Neutralino.os.getEnv("HOME")}/.apps/yuzu/`,
            "keys": true,
            "version": "latest"
        };

        if (!await Neutralino.storage.getData("settings")) {
            await Neutralino.storage.setData("settings", JSON.stringify(settings));
            return settings;
        }

        settings = JSON.parse(await Neutralino.storage.getData("settings"));
        return settings;
    },
    set: async (newSettings: Settings): Promise<Settings[]> => {
        const oldSettings = JSON.parse(await Neutralino.storage.getData("settings"));
        await Neutralino.storage.setData("settings", JSON.stringify(newSettings));

        return [...oldSettings, newSettings];
    }
}