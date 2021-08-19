const request = require("request");
const fs = require("fs");
const os = require('os');
const filePath = os.homedir() + "/.church-clocks/functionSettings/proVideoPlayer/";
module.exports = function () {
    this.function = "proVideoPlayer";
    this.parent = undefined;
    this.storedInformation = {
        "transportStates": {}
    };
    this.connected = false;
    this.updaterInterval = undefined;
    this.checkFailInterval = undefined;
    this.enabled = false;
    this.hasConfigurableItems = true;

    this.protocol = "http";
    this.host = "0.0.0.0";
    this.port = "49414";
    this.apiLocation = "/api/0/";
    this.authToken = "";

    //Handle incoming requests
    this.handleIncoming = function (message, callback) {
        if (message === undefined) { return false; }
        if (message.function == this.function) {
            switch (message.command) {
                case "getConfigurableItems": {
                    callback({
                        enabled: {
                            title: "Enabled",
                            description: "Should this function be enabled?",
                            value: this.enabled,
                            type: "text"
                        },
                        host: {
                            title: "Host",
                            description: "The host's IP address",
                            value: this.host,
                            type: "text"
                        },
                        port: {
                            title: "Port",
                            description: "PVP's port (found in settings)",
                            value: this.port,
                            type: "text"
                        },
                        apiLocation: {
                            title: "API Location",
                            description: "The location for the API",
                            value: this.apiLocation,
                            type: "text"
                        },
                        authToken: {
                            title: "Auth Token",
                            description: "The authentication token found in settings",
                            value: "unchanged",
                            type: "password"
                        }
                    });
                    return true;
                }
                case "setConfigurableItems": {
                    var self = this;

                    //Check password
                    if (message.passwordCorrect == true) {

                        //Populate unchanged values with the current values
                        if (message.value["enabled"] === undefined || message.value["enabled"] == "unchanged") {
                            message.value["enabled"] = this.enabled;
                        }
                        if (message.value["host"] === undefined || message.value["host"] == "unchanged") {
                            message.value["host"] = this.host;
                        }
                        if (message.value["port"] === undefined || message.value["port"] == "unchanged") {
                            message.value["port"] = this.port;
                        }
                        if (message.value["apiLocation"] === undefined || message.value["apiLocation"] == "unchanged") {
                            message.value["apiLocation"] = this.apiLocation;
                        }
                        if (message.value["authToken"] === undefined || message.value["authToken"] == "unchanged") {
                            message.value["authToken"] = this.authToken;
                        }

                        //Attempt to write the settings
                        this.writeSettings(message.value["enabled"], message.value["host"], message.value["port"], message.value["apiLocation"], message.value["authToken"], function (success) {
                            if (success == true) {
                                self.parent.emit("information", self.parent.generateInformationEvent(self.function, "configurationSuccess", "Saved successfully"));
                                callback(true);
                                self.parent.emit("control", self.parent.generateControlEvent("exit", "Restarting process on settings change"));
                            }
                            else {
                                callback("Failed to save configuration");
                                self.parent.emit("error", self.parent.generateErrorState(self.function, "configuration", "Failed to save configuration"));
                            }
                        });
                        return true;
                    }
                    else {
                        callback("Incorrect password");
                        return true;
                    }
                    break;
                }
            }
        }
    }


    //On connection change
    this.connectionChange = function (state, forceAttemptReconnection = false) {
        if (state != this.connected || forceAttemptReconnection == true) {
            var object = this;
            var friendlyState = "disconnected";
            this.connected = state;
            if (state == true) { friendlyState = "connected"; }
            this.parent.emit("connectionStatus", this.parent.generateConnectionState(this.function, friendlyState));

            if (state == false || forceAttemptReconnection == true) {
                clearTimeout(this.connectionTimeout);
                clearInterval(this.updaterInterval);
                this.connectionTimeout = setTimeout(function () {
                    object.connect();
                }, 5000);
            }
        }
    }

    this.sendRequest = function (requestURL, callback) {
        var success = false;
        var object = this;
        request(this.protocol + "://" + this.host + ":" + this.port + this.apiLocation + requestURL, headers = { "Authorization": this.authToken }, function (error, result, body) {
            if (error) {
                switch (error.code) {
                    case "CERT_HAS_EXPIRED": {
                        object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "HTTPS is not supported"));
                        success = true;
                        callback(false);
                        break;
                    }
                    case "EHOSTUNREACH": {
                        object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Could not reach host @ " + this.host + ":" + this.port));
                        success = true;
                        callback(false);
                        break;
                    }
                    case "ECONNREFUSED": {
                        object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Connection Refused. Is PvP Open?"));
                        success = true;
                        callback(false);
                        break;
                    }
                    default: {
                        object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Unhandled Exception: " + error));
                        success = true;
                        callback(false);
                        break;
                    }
                }
                return false;
            }
            else if (body.length > 1) {
                success = true;
                callback(true, body);
            }
            else {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Incorrect authentication or empty message"));
                success = true;
                callback(false);
            }
        });
        setTimeout(function () { if (success == false) { object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "timeout")); success = undefined; callback(false); } }, 5000);
    }

    //Attempt to setup
    this.setup = function (parent) {
        this.parent = parent;
    }

    //Attempt connection
    this.connect = async function () {
        var object = this;
        this.parent.emit("connectionStatus", this.parent.generateConnectionState(this.function, "connecting"));
        this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "readingSettings"));
        await this.readSettings();

        if (!this.enabled) { return; }

        clearInterval(this.updaterInterval);
        this.updaterInterval = setInterval(function () {
            //Playlists
            object.sendRequest("transportState/workspace", function (success, body) {
                if (success) {
                    object.storedInformation.transportStates = JSON.parse(body);
                }
            });

            object.parent.emit("functionEvent", object.parent.generateInformationEvent(object.function, "informationChange", object.storedInformation));
        }, 500);
    }

    this.setFilePath = function (filePath) {
        this.filePath = filePath;
    }

    //Write the settings file though a prompt (used for the install script)
    this.writeSettingsPrompt = function () {
        var object = this;
        callback = function (values, callback) {
            object.writeSettings(true, values[0], values[1], values[2], values[3], callback);
        }
        return { "values": ["Host", "Port", "API Location (default /api/0/)", "Auth Token (or Empty)"], "callback": callback };
    }

    //Write the current settings to file
    this.writeSettings = function (enabled, host, port, apiLocation, authToken, callback) {
        var object = this;
        var settings = "";
        var settings = "Church Clocks ProVideoPlayer Configuration File\n\n";
        settings += "enabled=" + (enabled || false) + "\n";
        settings += "host=" + host + "\n";
        settings += "port=" + port + "\n";
        settings += "apiLocation=" + apiLocation + "\n";
        settings += "authToken=" + authToken + "\n";

        fs.writeFile(this.filePath + "proVideoPlayerSettings.txt", settings, "utf-8", function (err) {
            if (err) { object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to read/write the settings file")); if (callback) { callback(false); } }
            else {
                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was written successfully"));
                if (callback) { callback(true); }
            }
        });
    },

        this.readSettings = function (callback) {
            var object = this;
            try {
                var data = fs.readFileSync(this.filePath + "proVideoPlayerSettings.txt");
                try {
                    object.enabled = data.toString().split("enabled=")[1].split("\n")[0];
                    object.host = data.toString().split("host=")[1].split("\n")[0];
                    object.port = data.toString().split("port=")[1].split("\n")[0];
                    object.apiLocation = data.toString().split("apiLocation=")[1].split("\n")[0];
                    object.authToken = data.toString().split("authToken=")[1].split("\n")[0];



                    if (object.host === undefined || object.port === undefined || object.apiLocation === undefined || object.authToken === undefined) {
                        throw "invalid settings read";
                    }

                    object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was read successfully"));
                    if (callback) { callback(true); }
                }
                catch (e) {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file was corrupt so it has been recreated"));
                    object.writeSettings(false, "<YOUR_IP_ADDRESS_HERE>", "<YOUR_PORT_HERE>", "/api/0/", "<YOUR_AUTH_TOKEN_HERE_OR_EMPTY>", function(success) {
                        if(success == true) {
                            object.readSettings(object, callback);
                        }
                    });
                }
            }
            catch (e) {
                switch (e.code) {
                    case "ENOENT": {
                        object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file didn't exist, creating it"));
                        object.writeSettings(false, "<YOUR_IP_ADDRESS_HERE>", "<YOUR_PORT_HERE>", "/api/0/", "<YOUR_AUTH_TOKEN_HERE_OR_EMPTY>", function (success) {
                            if (success == true) {
                                object.readSettings(object, callback);
                            }
                            else {
                                if (callback) { callback(false) };
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