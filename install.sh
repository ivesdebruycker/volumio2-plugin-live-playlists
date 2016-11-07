#!/bin/bash

echo "Initializing config"
mkdir /data/configuration/music_service/live_playlists
cp /data/plugins/music_service/live_playlists/config.json /data/configuration/music_service/live_playlists/config.json
chown volumio:volumio /data/configuration/music_service/live_playlists/config.json

echo "Install NodeJS dependencies"
( cd /data/plugins/music_service/live_playlists && npm install )

echo "plugin install end"