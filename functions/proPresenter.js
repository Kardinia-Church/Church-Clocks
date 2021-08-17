const WebSocket = require('ws');
const fs = require("fs");
const os = require('os');
module.exports = function() {
    this.function = "proPresenter";
    this.host = "0.0.0.0";
    this.port = "49877";
    this.password = "";
    this.ws = undefined;
    this.parent = undefined;
    this.storedInformation = {};
    this.connected = false;
    this.enabled = false;

    //Attempt to setup
    this.setup = function(parent) {
        this.parent = parent;
    }

    //Handle incoming messages from this
    this.handleIncoming = function(msg) {
        switch(msg.acn) {
            //Multiple messages incoming split them
            case "fv": {
                var array = msg.ary;
                for(var i = 0; i < array.length; i++) {
                    this.handleIncoming(array[i]);
                }
                break;
            }
            case "ath": {
                if(msg.ath === true && msg.err === "") {
                    this.connectionChange(true);
                }
                else {
                    this.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Authorization is incorrect"));
                }
                break;
            }
            default: {
                this.storedInformation[msg.acn] = msg;
                this.parent.emit("functionEvent", this.parent.generateInformationEvent(this.function, "informationChange", this.storedInformation));
                break;
            }
        }
    }

    //On connection change
    this.connectionChange = function(state, forceAttemptReconnection=false) {
        if(state != this.connected || forceAttemptReconnection == true) {    
            var object = this;
            var friendlyState = "disconnected";
            this.connected = state;
            if(state == true){friendlyState = "connected";}
            this.parent.emit("connectionStatus", this.parent.generateConnectionState(this.function, friendlyState));

            if(state == false || forceAttemptReconnection == true) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = setTimeout(function() {
                    object.connect();
                }, 5000);
            }
        }
    }

    //Attempt to send a json formatted object to thisv
    this.send = function(object) {
        //If connected send it otherwise don't
        if(this.ws.readyState == 1) {
            try {
                this.ws.send(JSON.stringify(object));
            }
            catch(e) {
                this.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to send message: " + e));
            }
        }
        else {
            this.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Cannot send while disconnected"));
        }
    },

    //Attempt connection
    this.connect = async function() {
        var object = this;
        this.parent.emit("connectionStatus", this.parent.generateConnectionState(this.function, "connecting"));
        this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "readingSettings"));
        await this.readSettings();

        if (!this.enabled) { return; }
        
        var socketAddr = "ws://" + object.host + ":" + object.port + "/stagedisplay";
        try { 
            object.ws = new WebSocket(socketAddr);
            object.ws.on("open", function(event) {
                object.send({"pwd":object.password,"ptl":610,"acn":"ath"});
            });

            object.ws.on("message", function(message) {
                object.handleIncoming(JSON.parse(message));
            });
            
            object.ws.on("close", function(event) {
                object.connectionChange(false);
                object.storedInformation = {};
            });

            object.ws.on("error", function(error) {
                object.connectionChange(false, true);
                object.storedInformation = {};
            });
        }
        catch(e) {
            this.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to open WebSocket: " + e));
        }
    }

    this.setFilePath = function(filePath) {
        this.filePath = filePath;
    }

    //Write the settings file though a prompt (used for the install script)
    this.writeSettingsPrompt = function() {
        var object = this;
        callback = function(values, callback) {
            object.writeSettings(true, values[0], values[1], values[2], callback);
        }
        return {"values": ["Host", "Port", "Password"], "callback": callback};
    }

    //Write the current settings to file
    this.writeSettings = function(enabled, host, port, password, callback) {
        var object = this;
        var settings = "Church Clocks ProPresenter Configuration File\n\n";
        settings += "enabled=" + (enabled || false) + "\n";
        settings += "host=" + host + "\n";
        settings += "port=" + port + "\n";
        settings += "password=" + password + "\n";

        fs.writeFileSync(this.filePath + "proPresenterSettings.txt", settings, "utf-8", function (err) {
            if(err){object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to read/write the settings file")); if(callback){callback(false);}}
            else {
                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was written successfully"));
                if(callback){callback(true);}
            }
        });
      },

    this.readSettings = function(callback) {
        var object = this;
        try {
            var data = fs.readFileSync(this.filePath + "proPresenterSettings.txt");
            try {
                object.host = data.toString().split("host=")[1].split("\n")[0];
                object.port = data.toString().split("port=")[1].split("\n")[0];
                object.password = data.toString().split("password=")[1].split("\n")[0];
                

                if(object.host === undefined || object.port === undefined || object.password === undefined){throw "invalid read";}

                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was read successfully"));
                if(callback){callback(true);}
            }
            catch(e) {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file was corrupt so it has been recreated"));
                object.writeSettings(false, "<YOUR_IP_ADDRESS_HERE>", "49877", "<YOUR_PASSWORD_HERE>"); 
                object.readSettings(object, callback);
            }
        }
        catch(e) {
            switch(e.code) {
                case "ENOENT": {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file didn't exist, creating it"));
                    object.writeSettings(false, "<YOUR_IP_ADDRESS_HERE>", "49877", "<YOUR_PASSWORD_HERE>", function(success) {
                        if(success == true) {
                            object.readSettings(object, callback);
                        }
                        else {
                            if(callback){callback(false)};
                        }
                    }); 
                    break;
                }
                default: {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to read/write the settings file"));
                }
            }   
        }
    }
}