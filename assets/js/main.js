var currURL, initialURL = "http://kuckuck.masonx.ca:3000/logs", lastURL = [{path:"/", url:initialURL}], myFile;

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function hGET(url, cb) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            cb(xmlHttp.responseText);
    };
    xmlHttp.open("GET", url, true); // true for asynchronous 
    console.log(url);
    xmlHttp.send(null);
}

var fmHandleClick = function() {
    var type = this.getAttribute("data-url");
    handleStuff(type);
};

var handleStuff = function(type, performMagic) {
    if (type.slice(-4) === ".log") {
        // is file, load log
        hGET(type, fetchFileA);
        myFile = type;
        if (performMagic) {
            currURL = initialURL;
            hGET(currURL, initCB);
        }
    } else if (type.slice(-2) == "..") {
        var tmp = lastURL.length == 1 ? lastURL[0] : lastURL.pop();
        currURL = tmp.url;
        hGET(currURL, initCB);
    } else {
        lastURL.push({path: currURL, url:currURL});
        currURL = type;
        hGET(currURL, initCB);
    }
};

function reRegisterListeners() {
    var classname = document.getElementsByClassName("fileman-link");

    for (var i = 0; i < classname.length; i++) {
        classname[i].addEventListener('click', fmHandleClick, false);
    }
}

var initCB = function(j) {
    var e = document.getElementById("logslist");
    var v = "";
    var t = JSON.parse(j);
    
    v += "<li data-url=\"..\" class=\"fileman-link\">..</li>";
    
    for (var i = 0; i < t.length; i++) {
        v += "<li data-url=\""+currURL+'/'+t[i]+"\" class=\"fileman-link\">"+t[i].replace(/_/g, '#')+"</li>";
    }
    
    e.innerHTML = v;
    reRegisterListeners();
};

var fetchFileA = function(j) {
    var block = document.getElementById("log");
    block.innerHTML = j.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

(function() {
    var str = getParameterByName('log');
    if (str && str != "") {
        currURL = str;
        handleStuff(str, true);
    } else {
        currURL = initialURL;
        hGET(currURL, initCB);
    }
    document.getElementById("refresh").addEventListener("click", function() {
        if (myFile) hGET(myFile, fetchFileA);
    });
})();
