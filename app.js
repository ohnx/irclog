var fs = require('fs');
var path = require('path');
var irc = require('irc');
var dateFormat = require('dateformat');
var mkdirp = require('mkdirp');
var express = require('express');
var recursive = require('recursive-readdir');
var app = express();

// IRC STUFF

var serverconfigfile = fs.readFileSync("config.json");
var serverconfig = JSON.parse(serverconfigfile);

var client = new irc.Client(serverconfig["host"], serverconfig["nickname"], {
    channels: serverconfig["channels"],
    password: serverconfig["password"],
    port: serverconfig["port"]
});

var owner = serverconfig["owner"];

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
    if (from == owner) {
        if (message.indexOf("join") == 1) client.join(message.substring(6));
        else if (message.indexOf("part") == 1) client.part(message.substring(6));
    } else if (message.indexOf("logs") == 1) {
        client.say(from, "Logs for " + to + " are available here: http:\/\/kuckuck.treehouse.su:3000\/logs\/" + to.replace(/#/g, '_'));
    }
    console.log('('+to+')'+strOut);
    log(to.replace(/#/g, '_'), strOut);
});

client.addListener('action', function(from, to, message) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] * ' + from + ' ' + message);
    log(to.replace(/#/g, '_'), strOut);
});

client.addListener('nick', function (oldnick, newnick, channels) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] ' + oldnick + ' -> ' + newnick);
    for (var i = 0; i < channels.length; i++) {
        log(channels[i].replace(/#/g, '_'), strOut);
    }
});

client.addListener('notice', function (from, to, message) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] ' + from + '! ' + message);
    if (from == owner) {
        if (message.indexOf("join") == 1) client.join(message.substring(6));
        else if (message.indexOf("part") == 1) client.part(message.substring(6));
        else if (message.indexOf("raw") == 1) client.raw(message.substring(5));
    }
    log(to.replace(/#/g, '_'), strOut);
});

client.addListener('join', function (chan, nick) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] + ' + nick);
    log(chan.replace(/#/g, '_'), strOut);
});

client.addListener('part', function (chan, nick, comment) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] - ' + nick + ' (' + comment + ')');
    log(chan.replace(/#/g, '_'), strOut);
});

client.addListener('kick', function (chan, nick, by, reason) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] - ' + nick + ' [kick by ' + by + ': ' + reason + ']');
    log(chan.replace(/#/g, '_'), strOut);
});

client.addListener('quit', function (who, reason, channels) {
    var now = new Date();
    var strOut = ('[' + dateFormat(now, "HH:MM:ss") + '] - ' + who + ' [quit :' + reason + ']');
    for (var i = 0; i < channels.length; i++) {
        log(channels[i].replace(/#/g, '_'), strOut);
    }
});

client.addListener('invite', function (chan, from) {
    if (from == owner) client.join(chan);
});

client.addListener('error', function (message) {
    console.log('error: ', message);
});

// WEB STUFF

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.use('/logs', express.static('logs'));

app.use('/', function(req, res) {
    res.setHeader('content-type', 'text/plain');
    fs.readdir(path.join(__dirname, req.path), function(err, files) {
        if (!err) res.send(JSON.stringify(files).replace(/\\\\/g, '/'));
        else res.send(err);
    });
});

app.listen(process.env.port || 3000, function () {
  console.log('listening on port ' + (process.env.port || 3000));
});
