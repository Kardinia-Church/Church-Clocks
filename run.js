const churchClocks = require("./app.js");
const fs = require("fs");
const os = require('os');
const filePath = os.homedir() + "/.church-clocks/";
var webSocketEnabled = false;
var webSocketPassword = "";
var webSocketPort = 0;

var webServerEnabled = false;
var webServerPort = false;

module.exports = {
    generateSettings: function() {
        var object = this;
        callback = function(values, callback) {
            object.writeDefaults(values[0], values[1], values[2], values[3], values[4]);
        }
        return {"values": ["Web Socket Enabled", "Web Socket Password", "Web Socket Port", "Web Server Enabled", "Web Server Port"], "callback": callback};
    }
}

//Write the default configuration file
function writeDefaults(webSocketEnabled = true, webSocketPassword = "", webSocketPort=9955, webServerEnabled=true, webServerPort=80) {
    var settings = "Church Clocks Configuration File\n\n";
    settings += "* Web Socket Settings *\n";
    settings += "webSocketEnabled=" + webServerEnabled + "\n";
    settings += "webSocketPassword=" + webSocketPassword + "\n";
    settings += "webSocketPort=" + webSocketPort + "\n";

    settings += "* Web Server Settings *\n";
    settings += "webServerEnabled=" + webServerEnabled + "\n";
    settings += "webServerPort=" + webServerPort + "\n";

    fs.writeFileSync(filePath + "applicationSettings.txt", settings, "utf-8", function (err) {
        if(err){console.log("Failed to write default settings file");}
        else {
            console.log("Wrote default settings file");
        }
    });
}

//Read the settings file
function readSettings(callback) {
    //Check the directory exists
    if (!fs.existsSync(filePath)){
        fs.mkdirSync(filePath);
    }

    try {
        var data = fs.readFileSync(filePath + "applicationSettings.txt");
        try {
            webSocketEnabled = data.toString().split("webSocketEnabled=")[1].split("\n")[0] == "true";
            webSocketPassword = data.toString().split("webSocketPassword=")[1].split("\n")[0];
            webSocketPort = parseInt(data.toString().split("webSocketPort=")[1].split("\n")[0]);

            webServerEnabled =  data.toString().split("webServerEnabled=")[1].split("\n")[0] == "true";
            webServerPort = parseInt(data.toString().split("webServerPort=")[1].split("\n")[0]);

            if(webServerEnabled == true) {
                webSocketPort = 9955;
                console.log("Websocket port forced to 9955 as webServer is enabled!");
            }

            if(webSocketEnabled === undefined || webSocketPassword === undefined || webSocketPort === undefined || webServerEnabled === undefined || webServerPort === undefined) {
                throw "invalid config";
            }

            callback(true);
        }
        catch(e) {console.log("Settings file was corrupt. It was reset"); writeDefaults(); callback(false);}
    }
    catch(e) {console.log("Settings file not found. It was created"); writeDefaults(); callback(false);}
}

readSettings(function(success) {
    var clocks = new churchClocks(webSocketEnabled, webSocketPassword, webSocketPort, webServerEnabled, webServerPort, filePath);
    clocks.on("connectionStatus", function(message) {
        console.log("Connection Update [" + message.function + "]: " + message.state);
    });
    clocks.on("information", function(message) {
        console.log("Information Update [" + message.function + "][" + message.type + "]: " + message.value);
    });
    clocks.on("functionEvent", function(message) {
        //console.log("Got Function Event [" + message.function + "][" + message.type + "]: " + JSON.stringify(message.value));
    });
    clocks.on("error", function(message) {
        console.log("Error! [" + message.function + "][" + message.type + "]: " + message.error);
    });
    clocks.on("configuration", function(message) {
        console.log("Configuration Event [" + message.function + "][" + message.type + "]: " + JSON.stringify(message.value));
    });
    clocks.connect();
});