interface Settings {
    customPath?: string,
    path: boolean,
    keys: boolean,
    version: string
}

interface Release {
    version: string,
    url: string
};

declare let Neutralino: any;
const progressBar: HTMLDivElement = document.querySelector("#progress");

const getReleases = async () => {
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
        })
    };

    return releases;
}

const download = async (type: string, settings: Settings) => {
    switch (type) {
        case "AppImage":
            const releases = await getReleases();
            let release: Release = releases.find(release => release.ref == `refs/tags/${settings.version}`);
            if (settings.version == "latest") release = releases[0];

            if (settings.customPath && settings.path) {

            };

            const response = await fetch(`https://fuckcors.app/${release.url}`) // have to use cors proxy until neutralino can bypass cors

            // https://stackoverflow.com/a/64123890
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;

            const res = new Response(new ReadableStream({
                async start(controller) {
                    const reader = response.body.getReader();
                    for (; ;) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        loaded += value.byteLength;
                        progressBar.style.width = `${Math.round(loaded / total * 100)}%`
                        controller.enqueue(value);
                    }
                    controller.close();
                }
            }));
            const blob = await res.blob();

            await Neutralino.filesystem.writeBinaryFile(`${settings.path}/yuzu.AppImage`, blob.arrayBuffer());
            break;
        case "keys":
            break;
    }
}