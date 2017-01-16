var fs = require('fs');
var irc = require('irc');
var dateFormat = require('dateformat');
var mkdirp = require('mkdirp');
var express = require('express');
var recursive = require('recursive-readdir');
var app = express();
var stuff = "";


var client = new irc.Client('irc.freenode.net', 'ohnx-logbot', {
    channels: ['##ohnx', '##'],
});

var getDate = function() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0
    var yyyy = today.getFullYear();

    if (dd<10) dd = '0' + dd;
    if (mm<10) mm = '0' + mm;

    return yyyy + '-' + mm + '-' + dd;
};

mkdirp('logs/');

var log = function(chan, str) {
    var folder = "logs/" + chan + "/";
    mkdirp(folder, function(error) {
        if (error) return console.log(error);
        fs.appendFile(folder + getDate() + ".log", str+'\n', function(err) {
            if(err) {
                return console.log(err);
            }
        });
    });
};

client.addListener('message', function (from, to, message) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] ' + from + ': ' + message);
    if (message.indexOf("join") == 1 && from == "ohnx") client.join(message.substring(6));
    if (message.indexOf("part") == 1 && from == "ohnx") client.part(message.substring(6));
    console.log('('+to+')'+strOut);
    log(to.replace(/#/g, '_'), strOut);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

app.use('/logs', express.static('logs'));

app.use('/', function(req, res) {
    res.setHeader('content-type', 'text/plain');
    recursive('logs/', function (err, files) {
        res.send(JSON.stringify(files).replace(/\\\\/g, '/'));
    });
});

app.listen(process.env.port || 3000, function () {
  console.log('listening on port ' + (process.env.port || 3000));
});
