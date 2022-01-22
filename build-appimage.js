const path = require('path');

const { Bundler } = require('neutralino-appimage-bundler');

const bundler = new Bundler({
    desktop: {
        name: 'Yuzu Early Access Updater for Linux',
        icon: path.join(__dirname, 'src/resources/icons/appIcon.png'),
        categories: ['Game']
    },
    binary: {
        name: 'yuzu-ea-updater-for-linux',
        dist: path.join(__dirname, 'src/dist')
    },
    includeLibraries: true,
    output: path.join(__dirname, 'src/dist/yuzu-ea-updater-for-linux.AppImage'),
    version: '2.0.0'
});

bundler.bundle();