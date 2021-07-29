let url = "",
    save = "default";

// get user settings
api.send("getSettings")
api.receive("settings", settings => {
    settings = JSON.parse(settings)
    url = settings.url;
    save = settings.save;
    if (settings.save == "default") {
        api.send("homeFolder")
    } else {
        document.querySelector("#lol").innerText = settings.save;
    }
    // get releases
    api.send("releases")
    api.receive("releases", releases => {
        releases = JSON.parse(releases)
        releases[0].version = `Latest (${releases[0].version})`
        if (!url) url = releases[0].url;
        releases.forEach((release, index) => {
            let elem = document.createElement("option");
            elem.value = release.url
            if (settings.latest && index == 0 || url == release.url) elem.setAttribute("selected", "selected")
            elem.innerText = release.version
            document.querySelector("#releases").appendChild(elem);
        })
    });
})

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
}

function dl() {
    api.send("download", {
        url: url,
        save: save,
    });

    api.receive("percent", percent => {
        document.querySelector("#downloaded").innerText = formatBytes(percent.transferredBytes);
        document.querySelector("#total").innerText = formatBytes(percent.totalBytes);
        document.querySelector("#progress").style.width = `${Math.round(percent.percent*100)}%`
    });
    
    api.receive("finished", () => {
        document.querySelector(".progress").style.display = "none";
        document.querySelector(".finish").style.display = "block";
    })
}

document.querySelector("#install").addEventListener("click", event => {
    document.querySelector(".buttons").style.display = "none";
    document.querySelector(".progress").style.display = "block";
    dl()
    event.preventDefault()
})

document.querySelector("#settings").addEventListener("click", event => {
    document.querySelector(".buttons").style.display = "none";
    document.querySelector(".settings").style.display = "block";
    event.preventDefault()
})

document.querySelector("#save").addEventListener("click", event => {
    let latest = false;
    document.querySelector(".settings").style.display = "none";
    document.querySelector(".buttons").style.display = "block";
    if (document.querySelector("#releases").selectedOptions[0].innerText.startsWith("Latest (")) latest = true;
    api.send("save", JSON.stringify({
        url: document.querySelector("#releases").selectedOptions[0].value,
        save: save,
        latest: latest
    }));
    url = document.querySelector("#releases").selectedOptions[0].value
    event.preventDefault()
})

document.querySelector("#folder").addEventListener("click", event => {
    api.send("selectFolder")
    event.preventDefault()
})

document.querySelector("#default").addEventListener("click", event => {
    save = "default";
    api.send("homeFolder")
    event.preventDefault()
})

document.querySelector("#exit").addEventListener("click", event => {
    api.send("exit")
    event.preventDefault()
})

api.receive("folder", ([folder]) => {
    document.querySelector("#lol").innerText = "Current Folder: " + folder
    if (!folder) return;
    save = folder;
});

api.receive("homeFolder", folder => {
    document.querySelector("#lol").innerText = "Current Folder: " + folder + "/.apps/yuzu"
    document.querySelector("#shortcut").innerText = folder + "/.local/share/applications/yuzu Early Access.desktop"
})

window.onkeydown = function(evt) {
    if ((evt.code == "Minus" || evt.code == "Equal") && (evt.ctrlKey || evt.metaKey)) {evt.preventDefault()}
}