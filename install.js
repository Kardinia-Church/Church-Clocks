const prompt = require('prompt-async');
const os = require('os');
const fs = require("fs");
const churchClocks = require("./app.js");
prompt.start();
var dir = os.homedir() + "/.church-clocks/"

async function setup() {
    console.log("Church Clocks Setup");
    console.log("Would you like to set this up as a runable application? (YES/NO)");
    
    var generate = await prompt.get(["Generate Settings File? (yes/no)"]);
    if(generate["Generate Settings File? (yes/no)"].toUpperCase() == "YES" || generate["Generate Settings File? (yes/no)"].toUpperCase() == "Y") {
    
        //Check the directory exists
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
            console.log("Created directory");
        }
        console.log("Settings directory @ " + dir);
    
    
        var clocks = new churchClocks(false, "", 0, 0, 0, dir);
        clocks.on("error", function(){});
        clocks.connect();

        //Setup function settings
        for(var i in clocks.functions) {
            console.log("**** " + clocks.functions[i].function + " settings ****");
            var func = clocks.functions[i].writeSettingsPrompt();

            var values = func.values;
            var callback = func.callback;
            var answers = [];

            var temp = await prompt.get(values);
            for(var j in temp) {
                answers.push(temp[j]);
            }

            callback(answers, function(success) { 
                if(success !== true){console.log("An error occurred writing that file");}
            });
        }


        //Application settings
        console.log("**** " + "application" + " settings ****");
        var func = generateSettings();
        var temp = await prompt.get(func.values);
        var callback = func.callback;
        var answers = [];
        for(var j in temp) {
            answers.push(temp[j]);
        }
        callback(answers, function(success) { 
            if(success !== true){console.log("An error occurred writing that file");}
        });
    }

    console.log("Setup complete!");
    process.exit();
}
setup();

//Generate the general settings file
function generateSettings() {
    callback = function(values, callback) {
        writeDefaults(values[0], values[1], values[2], values[3], values[4]);
    }
    return {"values": ["Web Socket Enabled (true/false)", "Web Socket Password", "Web Socket Port (default 9955)", "Web Server Enabled (true/false)", "Web Server Port (default 80)"], "callback": callback};
}

//Write the default configuration file
function writeDefaults(webSocketEnabled = true, webSocketPassword = "", webSocketPort=9955, webServerEnabled=true, webServerPort=80) {
    var settings = "Church Clocks Configuration File\n\n";
    settings += "* Web Socket Settings *\n";
    settings += "webSocketEnabled=" + webSocketEnabled + "\n";
    settings += "webSocketPassword=" + webSocketPassword + "\n";
    settings += "webSocketPort=" + webSocketPort + "\n";

    settings += "* Web Server Settings *\n";
    settings += "webServerEnabled=" + webServerEnabled + "\n";
    settings += "webServerPort=" + webServerPort + "\n";

    fs.writeFileSync(dir + "applicationSettings.txt", settings, "utf-8", function (err) {
        if(err){console.log("Failed to write default settings file");}
        else {
            console.log("Wrote default settings file");
        }
    });
}













