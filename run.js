const churchClocks = require("church-clocks");
const fs = require("fs")

var webSocketEnabled = false;
var webSocketPassword = "";
var webSocketPort = 0;

var webServerEnabled = false;
var webServerPort = false;

//Write the default configuration file
function writeDefaults() {
    var settings = "Church Clocks Configuration File\n\n";
    settings += "* Web Socket Settings *\n";
    settings += "webSocketEnabled=true\n";
    settings += "webSocketPassword=\n";
    settings += "webSocketPort=9955\n";

    settings += "* Web Server Settings *\n";
    settings += "webServerEnabled=true\n";
    settings += "webServerPort=7503\n";

    fs.writeFileSync("applicationSettings.txt", settings, "utf-8", function (err) {
        if(err){console.log("Failed to write default settings file");}
        else {
            console.log("Wrote default settings file");
        }
    });
}

//Read the settings file
function readSettings(callback) {
    try {
        var data = fs.readFileSync("applicationSettings.txt");
        try {
            webSocketEnabled = data.toString().split("webSocketEnabled=")[1].split("\n")[0] == "true";
            webSocketPassword = data.toString().split("webSocketPassword=")[1].split("\n")[0];
            webSocketPort = parseInt(data.toString().split("webSocketPort=")[1].split("\n")[0]);

            webServerEnabled =  data.toString().split("webServerEnabled=")[1].split("\n")[0] == "true";
            webServerPort = parseInt(data.toString().split("webServerPort=")[1].split("\n")[0]);


            if(webSocketEnabled === undefined || webSocketPassword === undefined || webSocketPort === undefined || webServerEnabled === undefined || webServerPort === undefined) {
                throw "invalid config";
            }

            callback(true);
        }
        catch(e) {console.log("Settings file was corupt. It was reset"); writeDefaults(); callback(false);}
    }
    catch(e) {console.log("Settings file not found. It was created"); writeDefaults(); callback(false);}
}

readSettings(function(success) {
    var clocks = new churchClocks(webSocketEnabled, webSocketPassword, webSocketPort);
    clocks.on("connectionStatus", function(message) {
        console.log("Connection Update [" + message.function + "]: " + message.state);
    });
    clocks.on("information", function(message) {
        console.log("Information Update [" + message.function + "][" + message.type + "]: " + message.value);
    });
    clocks.on("functionEvent", function(message) {
        console.log("Got Function Event [" + message.function + "][" + message.type + "]: " + message.value);
    });
    clocks.on("error", function(message) {
        console.log("Error! [" + message.function + "][" + message.type + "]: " + message.error);
    }); 
    clocks.connect();
});