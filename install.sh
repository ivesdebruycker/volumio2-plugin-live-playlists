#!/bin/bash

echo "Installing NodeJS dependencies"
( cd /data/plugins/music_service/live_playlists && npm install )
chown -R volumio:volumio /data/plugins/music_service/live_playlists

echo "plugininstallend"