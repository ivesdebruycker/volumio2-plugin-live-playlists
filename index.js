'use strict';

var libQ = require('kew');
var libMpd = require('mpd');

module.exports = live_playlists;

function live_playlists(context) {

    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.playlistManager = this.context.playlistManager;
    this.controllerMpd = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
}

live_playlists.prototype.onVolumioStart = function () {
    var self = this;
    //Perform startup tasks here

    return libQ.resolve();
};

live_playlists.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();
    self.addToBrowseSources();

    return defer.promise;
}

live_playlists.prototype.handleBrowseUri = function (curUri) {
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

    if(curUri.startsWith('live_playlists')){

        /*self.controllerMpd.mpdReady.then(function () {
            self.controllerMpd.clientMpd.sendCommand(libMpd.cmd('find Date "2016" base "NAS/Singles"', []), function (err, msg) {
                console.log(msg);
            });
        });*/

        /*self.controllerMpd.mpdReady.then(function () {
            self.controllerMpd.clientMpd.sendCommand(libMpd.cmd('find artist "Radiohead"', []), function (err, msg) {
                console.log(msg);
            });
        });*/

        if(curUri == 'live_playlists') {
            list.push({
                type: 'playlist',
                title: '10 random tracks',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_random_10'
            });
            list.push({
                type: 'playlist',
                title: '100 random tracks',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_random_100'
            });
            list.push({
                type: 'playlist',
                title: '500 random tracks',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_500'
            });
            list.push({
                type: 'playlist',
                title: 'Latest tracks',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_latest'
            });
            list.push({
                type: 'playlist',
                title: 'Tracks from 2015',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_year_2015'
            });
            list.push({
                type: 'playlist',
                title: 'Tracks from 2016',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_year_2016'
            });
            list.push({
                type: 'playlist',
                title: 'Tracks from the 80s',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_year_80s'
            });
            list.push({
                type: 'playlist',
                title: 'Tracks from the 90s',
                service:'live_playlists',
                icon: 'fa fa-list-ol',
                uri: 'live_playlists_year_90s'
            });
            defer.resolve(response);
        }
    }
    return defer.promise;
}

live_playlists.prototype.addToBrowseSources = function () {
    var data = {name: 'Live playlists', uri: 'live_playlists', plugin_type:'music_service',
        plugin_name:'live_playlists'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

live_playlists.prototype.explodeUri = function(uri) {
    var self = this;

    if(uri.startsWith('live_playlists_random')){
        switch (uri) {
            case 'live_playlists_random_50':
                return self.getRandom(50);
                break;
            case 'live_playlists_random_100':
                return self.getRandom(100);
                break;
            case 'live_playlists_random_500':
                return self.getRandom(500);
                break;
            default:
                return self.getRandom(10);
                break;
        }
    }

    if(uri.startsWith('live_playlists_year_')){
        switch (uri) {
            case 'live_playlists_year_2015':
                return self.findByYear(2015);
                break;
            case 'live_playlists_year_2016':
                return self.findByYear(2016);
                break;
            case 'live_playlists_year_80s':
                return self.findByYearRange(1980, 1989);
                break;
            case 'live_playlists_year_90s':
                return self.findByYearRange(1990, 1999);
                break;
            default:
                return self.findByYear(2000);
                break;
        }
    }

    if (uri === 'live_playlists_latest') {
        return self.findLastAdded();
    }
};

live_playlists.prototype.getRandom = function(count) {
    var self = this;
    var defer = libQ.defer();
    count = count || 10;

    self.controllerMpd.mpdReady.then(function () {
        self.controllerMpd.clientMpd.sendCommand(libMpd.cmd('listall', ["NAS/Singles"]), function (err, msg) {
            var items = [];
            if (msg) {
                var lines = msg.split('\n');
                var length = lines.length;
                var promises = [];
                for (var i = 0; i < count; i++) {
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
                });
            }
        });
    });

    return defer.promise;
};

live_playlists.prototype.findLastAdded = function() {
    return this.executeFind('modified-since "2016-06-01T00:00:00Z" base "NAS/Singles"');
};

live_playlists.prototype.findByYear = function(year) {
    return this.executeFind('Date "' + parseInt(year, 10) + '" base "NAS/Singles"');
};

live_playlists.prototype.findByYearRange = function(yearStart, yearEnd) {
    var defer = libQ.defer();
    var year = parseInt(yearStart, 10);
    var end = parseInt(yearEnd, 10);
    var itemsFinal = [];
    var promises = [];
    for(; year <= end; year++){
        promises.push(this.findByYear(year));
    }

    libQ.all(promises).then(function (itemsArr) {
        console.log('all resolved', itemsArr.length);
        for(var k = 0; k < itemsArr.length; k++){
            itemsFinal = itemsFinal.concat(itemsArr[k]);
        }
        defer.resolve(itemsFinal);
    })
    return defer.promise;
};

live_playlists.prototype.executeFind = function(argStr) {
    var self = this;
    var defer = libQ.defer();

    self.controllerMpd.mpdReady.then(function () {
        self.controllerMpd.clientMpd.sendCommand(libMpd.cmd('find ' + argStr, []), function (err, msg) {
            var items = self.parseFindResult(msg);
            defer.resolve(items);
        });
    });

    return defer.promise;
};

live_playlists.prototype.parseFindResult = function(msg) {
    var self = this;
    var items = [];
    var path;
    var name;
    if (msg) {
        var lines = msg.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('file:') === 0) {
                var path = line.slice(6);
                var name = path.split('/').pop();

                var artist = self.controllerMpd.searchFor(lines, i + 1, 'Artist:');
                var album = self.controllerMpd.searchFor(lines, i + 1, 'Album:');
                var title = self.controllerMpd.searchFor(lines, i + 1, 'Title:');
                var time = parseInt(self.controllerMpd.searchFor(lines, i + 1, 'Time:'));
                var albumart = self.controllerMpd.getAlbumArt({artist: artist, album: album}, self.controllerMpd.getParentFolder(path),'fa-dot-circle-o');

                if (title) {
                    title = title;
                } else {
                    title = name;
                }
                items.push({
                    uri: 'music-library/' + path,
                    service: 'mpd',
                    name: title,
                    artist: artist,
                    album: album,
                    type: 'track',
                    tracknumber: 0,
                    albumart: albumart,
                    duration: time,
                    trackType: path.split('.').pop()
                });
            }
        }
    }

    return items;
};

live_playlists.prototype.getTrackInfo = function(path){
    var self = this;

    return libQ.nfcall(self.controllerMpd.clientMpd.sendCommand.bind(self.controllerMpd.clientMpd), libMpd.cmd('listallinfo', [path])).then(function (msg) {
        var lines = msg.split('\n');
        var path = lines[0].slice(6);
        var name = path.split('/').pop();

        var artist = self.controllerMpd.searchFor(lines, 1, 'Artist:');
        var album = self.controllerMpd.searchFor(lines, 1, 'Album:');
        var title = self.controllerMpd.searchFor(lines, 1, 'Title:');
        var time = parseInt(self.controllerMpd.searchFor(lines, 1, 'Time:'));
        var albumart = self.controllerMpd.getAlbumArt({artist: artist, album: album}, self.controllerMpd.getParentFolder(path),'fa-dot-circle-o');

        if (title) {
            title = title;
        } else {
            title = name;
        }
        return {
            uri: 'music-library/' + path,
            service: 'mpd',
            name: title,
            artist: artist,
            album: album,
            type: 'track',
            tracknumber: 0,
            albumart: albumart,
            duration: time,
            trackType: path.split('.').pop()
        };

    });
};

live_playlists.prototype.onStop = function () {
    var self = this;
    //Perform stop tasks here
};

live_playlists.prototype.onRestart = function () {
    var self = this;
    //Perform restart tasks here
};

live_playlists.prototype.onInstall = function () {
    var self = this;
    //Perform your installation tasks here
};

live_playlists.prototype.onUninstall = function () {
    var self = this;
    //Perform your deinstallation tasks here
};

live_playlists.prototype.getUIConfig = function () {
    var self = this;

    //return {success: true, plugin: "live_playlists"};
};

live_playlists.prototype.setUIConfig = function (data) {
    var self = this;
    //Perform your UI configuration tasks here
};

live_playlists.prototype.getConf = function (varName) {
    var self = this;
    //Perform your tasks to fetch config data here
};

live_playlists.prototype.setConf = function (varName, varValue) {
    var self = this;
    //Perform your tasks to set config data here
};

//Optional functions exposed for making development easier and more clear
live_playlists.prototype.getSystemConf = function (pluginName, varName) {
    var self = this;
    //Perform your tasks to fetch system config data here
};

live_playlists.prototype.setSystemConf = function (pluginName, varName) {
    var self = this;
    //Perform your tasks to set system config data here
};

live_playlists.prototype.getAdditionalConf = function () {
    var self = this;
    //Perform your tasks to fetch additional config data here
};

live_playlists.prototype.setAdditionalConf = function () {
    var self = this;
    //Perform your tasks to set additional config data here
};
