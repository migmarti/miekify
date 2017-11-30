var AWS = require('aws-sdk');
var url = 'cc414-miekify-db.c6aodczcoukl.us-east-1.rds.amazonaws.com'
var lambda = new AWS.Lambda('"region":"us-east-1"')
var async = require("async");
var SpotifyWebApi = require("spotify-web-api-node");
var config = {
    server: url,
    database: 'MiekifyDB',
    user: 'miekify',
    password: 'password1',
    port: 8888
};
var sql = require('mssql');

var spotifyApi = new SpotifyWebApi({
    clientId: '2a574f39ab37489b8f23b3f4c514c778',
    clientSecret: 'fd8a5621559b4e3c8da0fa7941475e89 ',
    redirectUri: 'http://localhost:8888/miketest/examples/callback.html'
});

var totalCount = 0;

module.exports.get = (event, context, callback) => {
    spotifyApi.setAccessToken(event.token);
    count = 0;
    totalSongs = event.songIds.length;
    songId = event.songIds;
    toInsertSongs = [];
    toInsertSongsCount = 0;

    while (count < totalSongs) {
        if (toInsertSongsCount == 50) {
            getAudioFeatures(toInsertSongs);
            toInsertSongs = [];
            toInsertSongsCount = 0;
        };
        toInsertSongs.push(songId[count]);
        count += 1;
        toInsertSongsCount += 1;
    };
    if (toInsertSongsCount < 50) {
        getAudioFeatures(toInsertSongs);
    };
    callback(null, "Adding tracks");
}


function getAudioFeatures(songIds) {
    spotifyApi.getAudioFeaturesForTracks(songIds)
        .then(function (data) {
            data.body.audio_features.forEach(function (data) {
                var track = data;
                var acoustic = track.acousticness;
                var dance = track.danceability;
                var energy = track.energy;
                var instrumental = track.instrumentalness;
                var live = track.liveness;
                var speechiness = track.speechiness;
                var valence = track.valence;
                var id = track.id;
                insertSong(id, acoustic, dance, energy, instrumental, live, speechiness, valence);
                totalCount+=1;
            });

        }, function (err) {
            console.log(err);
        });
};

function insertSong(songId, acoustic, dance, energy, instrumental, live, speechiness, valence) {
    var dbConn = new sql.Connection(config);
    dbConn.connect().then(function () {
        var request = new sql.Request(dbConn);
        var query = "INSERT INTO SongFeatures VALUES('" + songId + "'," + acoustic + "," + dance + "," + energy + "," + instrumental + "," + live + "," + speechiness + "," + valence + ")";
        request.query(query).then(function (result) {
            dbConn.close();
        }).catch(function (err) {
            dbConn.close();
        });
    }).catch(function (err) {
        console.log(err);
    });
}