'use strict';

var libQ = require('kew');
var libMpd = require('mpd');

module.exports = random_playlist;

function random_playlist(context) {

    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.playlistManager = this.context.playlistManager;
    this.controllerMpd = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
}

random_playlist.prototype.onVolumioStart = function () {
    var self = this;
    //Perform startup tasks here

    return libQ.resolve();
};

random_playlist.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();
    self.addToBrowseSources();

    return defer.promise;
}

random_playlist.prototype.handleBrowseUri = function (curUri) {
    var self = this;
    var response = [];
    var defer = libQ.defer();

    var response = {
        navigation: {
            prev: {
                uri: "/"
            },
            lists: [{
                "availableListViews": ["list"],
                "items": []
            }]
        }
    };
    var list = response.navigation.lists[0].items;

    if(curUri.startsWith('random_playlist')){
        if(curUri == 'random_playlist') {
            list.push({
                type: 'playlist',
                title: '10 random tracks',
                service:'random_playlist',
                icon: 'fa fa-list-ol',
                uri: 'random_playlist_10'
            });
            list.push({
                type: 'playlist',
                title: '100 random tracks',
                service:'random_playlist',
                icon: 'fa fa-list-ol',
                uri: 'random_playlist_100'
            });
            list.push({
                type: 'playlist',
                title: '500 random tracks',
                service:'random_playlist',
                icon: 'fa fa-list-ol',
                uri: 'random_playlist_500'
            });
            defer.resolve(response);
        }
    }
    return defer.promise;
}

random_playlist.prototype.addToBrowseSources = function () {
    var data = {name: 'Random playlist', uri: 'random_playlist', plugin_type:'music_service',
        plugin_name:'random_playlist'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

random_playlist.prototype.explodeUri = function(uri) {
    var self = this;
    var items = [];

    var defer=libQ.defer();

    self.controllerMpd.mpdReady.then(function () {
        self.controllerMpd.clientMpd.sendCommand(libMpd.cmd('listall', ["NAS/Singles"]), function (err, msg) {
            var num = 10;
            if (uri === 'random_playlist_100') {
                num = 100;
            } else if (uri === 'random_playlist_500') {
                num = 1000;
            }
            if (msg) {
                var lines = msg.split('\n');
                var length = lines.length;
                var promises = [];
                for (var i = 0; i < num; i++) {
                    var randomLine = lines[Math.floor(Math.random() * length)];
                    if (randomLine.indexOf("file:") === 0) {
                        var path = randomLine.slice(6);
                        var promise = self.getTrackInfo(path).then(function (trackInfo) {
                            items.push(trackInfo);
                        });
                        promises.push(promise);
                    }
                }
                libQ.all(promises).then(function (content) {
                    defer.resolve(items);
                })
            }

        });
    });

    return defer.promise;
};

random_playlist.prototype.getTrackInfo = function(path){
    var self = this;

    return libQ.nfcall(self.controllerMpd.clientMpd.sendCommand.bind(self.controllerMpd.clientMpd), libMpd.cmd('listallinfo', [path])).then(function (msg) {
        var lines = msg.split('\n');
        var path = lines[0].slice(6);
        var name = path.split('/').pop();

        var artist = self.controllerMpd.searchFor(lines, 1, 'Artist:');
        var album = self.controllerMpd.searchFor(lines, 1, 'Album:');
        var title = self.controllerMpd.searchFor(lines, 1, 'Title:');

        if (title) {
            title = title;
        } else {
            title = name;
        }
        return {
            service: 'mpd',
            type: 'track',
            name: title,
            title: title,
            artist: artist,
            album: album,
            icon: 'fa fa-music',
            //albumart : self.controllerMpd.getAlbumArt({artist: artist, album: album}, path),
            uri: path,
            trackType: path.split('.').pop()
        };

    });
};

random_playlist.prototype.onStop = function () {
    var self = this;
    //Perform stop tasks here
};

random_playlist.prototype.onRestart = function () {
    var self = this;
    //Perform restart tasks here
};

random_playlist.prototype.onInstall = function () {
    var self = this;
    //Perform your installation tasks here
};

random_playlist.prototype.onUninstall = function () {
    var self = this;
    //Perform your deinstallation tasks here
};

random_playlist.prototype.getUIConfig = function () {
    var self = this;

    //return {success: true, plugin: "random_playlist"};
};

random_playlist.prototype.setUIConfig = function (data) {
    var self = this;
    //Perform your UI configuration tasks here
};

random_playlist.prototype.getConf = function (varName) {
    var self = this;
    //Perform your tasks to fetch config data here
};

random_playlist.prototype.setConf = function (varName, varValue) {
    var self = this;
    //Perform your tasks to set config data here
};

//Optional functions exposed for making development easier and more clear
random_playlist.prototype.getSystemConf = function (pluginName, varName) {
    var self = this;
    //Perform your tasks to fetch system config data here
};

random_playlist.prototype.setSystemConf = function (pluginName, varName) {
    var self = this;
    //Perform your tasks to set system config data here
};

random_playlist.prototype.getAdditionalConf = function () {
    var self = this;
    //Perform your tasks to fetch additional config data here
};

random_playlist.prototype.setAdditionalConf = function () {
    var self = this;
    //Perform your tasks to set additional config data here
};
