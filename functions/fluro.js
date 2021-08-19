const { UV_FS_O_FILEMAP } = require('constants');
const Fluro = require('fluro');
const fs = require('fs');

const API_URL = "https://api.fluro.io";

module.exports = function () {

    /** BUG
     * Currently the web socket doesn't care who sent what message
     * This for example makes password calls send to everyone
     * So client 1 can send a login and client 2 will also login
     * this will need to be fixed..
     * 
     * 
     */


    this.function = "fluro";
    this.parent = undefined;
    this.storedInformation = {};
    this.connected = false;
    this.updaterInterval = undefined;
    this.enabled = false;
    this.hasConfigurableItems = true;

    //Handle incoming requests
    this.handleIncoming = function (message) {
        if (message === undefined) { return false; }
        if (message.function == this.function) {
            switch (message.command) {
                case "getEvents": {
                    if (message.passwordCorrect == true) {
                        var self = this;

                        //Do a fluro API call to get all events within the set realm or all realms
                        this.getEvents().then((result) => {
                            self.parent.emit("configuration", self.parent.generateInformationEvent(self.function, "events", result));
                        }).catch((error) => {
                            console.log(error);
                            this.parent.emit("error", this.parent.generateErrorState(this.function, "apiCallError", "Something happened trying to get the events from Fluro"));
                        });
    
                        return true;
                    }
                    else {
                        this.parent.emit("error", this.parent.generateErrorState(this.function, "authenticationError", "Incorrect password"));
                        return true;
                    }
                }
                case "clearClock": {
                    this.realm = "";
                    this.track = "";
                    this.date = "";
                    this.planID = "";
                    this.eventID = "";
                    this.fetch();
                    this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "Clear clock"));
                    return true;
                }
                //Set the event id
                case "setEvent": {
                    this.realm = "";
                    this.track = "";
                    this.date = "";
                    this.planID = "";
                    this.eventID = message.value;
                    this.fetch();
                    this.parent.emit("configuration", this.parent.generateInformationEvent(this.function, "events", "Event set"));
                    return true;
                }
                case "setURL": {
                    //This uses the live.fluro.io website!
                    //Check password
                    if (message.passwordCorrect == true) {
                        var validURL = false;
                        if (message.value !== "") {
                            var split = message.value.split("/");
                            if (split.length == 5) {
                                this.realm = "";
                                this.track = "";
                                this.date = "";
                                this.eventID = "";
                                this.planID = split[4];
                                validURL = true;
                            }
                        }

                        if (validURL == true) {
                            this.fetch();
                        }
                        else {
                            this.parent.emit("error", this.parent.generateErrorState(this.function, "validationError", "URL is not in the correct format"));
                        }

                        return true;
                    }
                    else {
                        this.parent.emit("error", this.parent.generateErrorState(this.function, "authenticationError", "Incorrect password"));
                    }
                }
                case "getConfigurableItems": {
                    this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "Sending configurable items to the configurator"));

                    this.parent.emit("configuration", this.parent.generateInformationEvent(this.function, "getConfigurableItems", {
                        enabled: {
                            title: "Enabled",
                            description: "Should this function be enabled?",
                            value: this.enabled,
                            type: "text"
                        },
                        apiKey: {
                            title: "API Key",
                            description: "Fluro's API Key",
                            value: "unchanged",
                            type: "password"
                        },
                        realmId: {
                            title: "Realm ID",
                            description: "The realm to search in",
                            value: this.realm,
                            type: "text"
                        },
                        track: {
                            title: "Track",
                            description: "The track",
                            value: this.track,
                            type: "text"
                        },
                        date: {
                            title: "Date",
                            description: "A date to search for events in",
                            value: this.date,
                            type: "text"
                        },
                        eventID: {
                            title: "Event ID",
                            description: "A specific event id to latch to",
                            value: this.eventID,
                            type: "text"
                        },
                        planID: {
                            title: "Plan ID",
                            description: "A specific plan id to latch to",
                            value: this.planID,
                            type: "text"
                        },
                        roomIDs: {
                            title: "Room IDs",
                            description: "Room IDs to show in the event selector in setFluroClock.html. Separated by a ,",
                            value: this.roomIds,
                            type: "text"
                        },
                        timezone: {
                            title: "Timezone",
                            description: "The timezone to set",
                            value: this.timezone,
                            type: "text"
                        }
                    }));
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
                        if (message.value["apiKey"] === undefined || message.value["apiKey"] == "unchanged") {
                            message.value["apiKey"] = this.apiKey;
                        }
                        if (message.value["realmId"] === undefined || message.value["realmId"] == "unchanged") {
                            message.value["realmId"] = this.realm;
                        }
                        if (message.value["track"] === undefined || message.value["track"] == "unchanged") {
                            message.value["track"] = this.track;
                        }
                        if (message.value["date"] === undefined || message.value["date"] == "unchanged") {
                            message.value["date"] = this.date;
                        }
                        if (message.value["eventID"] === undefined || message.value["eventID"] == "unchanged") {
                            message.value["eventID"] = this.eventID;
                        }
                        if (message.value["planID"] === undefined || message.value["planID"] == "unchanged") {
                            message.value["planID"] = this.planID;
                        }
                        if (message.value["roomIDs"] === undefined || message.value["roomIDs"] == "unchanged") {
                            message.value["roomIDs"] = this.roomIds;
                        }
                        if (message.value["timezone"] === undefined || message.value["timezone"] == "unchanged") {
                            message.value["timezone"] = this.timezone;
                        }

                        //Attempt to write the settings
                        this.writeSettings(message.value["enabled"], message.value["apiKey"], message.value["realmId"], message.value["track"], message.value["date"], message.value["eventID"], message.value["planID"], message.value["roomIDs"], message.value["timezone"], function (success) {
                            if (success == true) {
                                self.parent.emit("configuration", self.parent.generateInformationEvent(self.function, "configurationSuccess", "Saved successfully"));
                                self.parent.emit("control", self.parent.generateControlEvent("exit", "Restarting process on settings change"));
                            }
                            else {
                                self.parent.emit("error", self.parent.generateErrorState(self.function, "configuration", "Failed to save configuration"));
                            }
                        });
                        return true;
                    }
                    else {
                        this.parent.emit("error", this.parent.generateErrorState(this.function, "authenticationError", "Incorrect password"));
                        return true;
                    }
                    break;
                }
            }
        }
    },

        //Get a selection of possible events
        this.getEvents = function (realmId, roomIds) {
            var self = this;
            return new Promise((resolve, reject) => {
                var dateRangeHours = 24 * 3;
                self.fluro.content.filter("event", {
                    select: "plans",
                    allDefinitions: true,
                    timezone: self.timezone,
                    startDate: new Date().toISOString(),
                    endDate: new Date(new Date().getTime() + (dateRangeHours * (1000 * 60 * 60))).toISOString(),
                    filter: {
                        operator: "and",
                        filters: [
                            {
                                key: "status",
                                comparator: "in",
                                values: ["active"]
                            },
                            {
                                key: "plans",
                                comparator: "notempty",
                            },
                            (self.realm || realmId) ? {
                                key: "realms",
                                comparator: "==",
                                value: realmId || self.realm
                            } : undefined,
                            (self.roomIds || roomIds) ? {
                                key: "rooms",
                                comparator: "in",
                                values: roomIds || self.roomIds.split(","),
                            } : undefined,
                        ]
                    }
                }).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    reject(error);
                });
            });
        },


        this.queryFluroPlan = async () => {

            var self = this;
            var object = this;

            // If planID is set in settings, resolve
            if (self.planID) {
                return new Promise((resolve, reject) => {
                    resolve(self.planID);
                });
            };

            // Initialise current date default
            let date = new Date();
            let currentDate = self.fluro.date.formatDate(date, 'YYYY-MM-DD')

            // If event ID is set, get plan ID based on event ID
            if (self.eventID) {
                return new Promise((resolve, reject) => {

                    self.fluro.api.get('/content/get/' + self.eventID)
                        .then(function (res) {
                            if (res.data.plans.length == 0) {
                                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "The selected event does not have any plans"));

                                reject("no plans for the current event");
                            }
                            resolve(res.data.plans[0]._id)
                        })
                        .catch(err => {
                            reject("Error fetching event from Fluro")
                        })
                }).catch(err => {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", err));
                });
            }


            // Initialise filter object
            var filter = {
                operator: 'and',
                filters: [{
                    key: 'status',
                    comparator: 'in',
                    values: ['active'],
                }]
            }

            // Realm ID from settings
            if (self.realm) {
                filter.filters.push({
                    key: "_event.realms",
                    comparator: "==",
                    title: "Event Realms",
                    value: self.realm,
                    dataType: "reference"
                })
            }

            // Track ID from settings
            if (self.track) {
                filter.filters.push({
                    key: 'track',
                    comparator: '==',
                    value: self.track,
                    dataType: "reference"
                })
            }

            // If no date is set, use currentDate
            if (!self.date) {

                filter.filters.push({
                    key: "_event.startDate",
                    comparator: "datesameday",
                    value: currentDate,
                    dataType: "date",
                })

            } else {

                // use Date from Settings
                filter.filters.push({
                    key: "_event.startDate",
                    comparator: "datesameday",
                    value: self.date,
                    dataType: "date"
                })

            }

            // TODO: Make these dynamic - Fluro requires a date range (don't query too many)
            let startDate = "2021-01-01T14:00:00.000Z"
            let endDate = "2021-12-01T14:00:00.000Z"

            // Initailise criteria object for Fluro
            var criteria = {
                allDefinitions: true,
                filter,
                startDate,
                endDate,
                timezone: self.timezone
            }


            return new Promise((resolve, reject) => {

                self.fluro.content.filter('plan', criteria)
                    .then(function (res) {
                        if (res.length == 0) {
                            reject("No plan found for current criteria")
                        };
                        resolve(res[0]._id)
                    })
                    .catch(err => {
                        reject("Error fetching data from Fluro")
                    })
            }).catch(err => {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", err));
            });
        };


    this.getData = async (itemID) => {
        var self = this;


        return new Promise((resolve, reject) => {

            const url = `/content/get/${itemID}`

            if (!itemID) reject("No itemID found");

            self.fluro.api.get(url, { cache: false })
                .then(res => resolve(res.data))
                .catch(err => {
                    reject("Error fetching plan data from Fluro")
                });
        }).catch(err => {
            object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", err));
        });

    };

    this.setFilePath = function (filePath) {
        this.filePath = filePath;
    }

    //Attempt to setup
    this.setup = function (parent) {
        this.parent = parent;
    }

    async function delay(ms) {
        return await new Promise(resolve => setTimeout(resolve, ms));
    }

    this.fetch = async () => {
        var object = this;

        // Get Fluro Plan ID based on current settings
        object.computedPlanID = await this.queryFluroPlan()
            .then(res => res)
            .catch(err => {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Error querying for plan item"));
                return false;
            });

        // If no plan found, try again in 60 seconds
        if (!object.computedPlanID) {
            await delay(60000);
            return object.fetch();
        }

        // Poll Fluro for Data every 3 Seconds
        this.dataFetch = setInterval(function () {

            object.getData(object.computedPlanID)
                .then(item => {
                    let current = item.data.current || null;
                    object.storedInformation.event = {
                        _id: item._id,
                        title: item.title,
                    };
                    object.storedInformation.startedAt = item.data.time;
                    object.storedInformation.currentItem = item.schedules.filter(schedule => schedule._id + "-" + schedule.title.split(" ")[0].toLowerCase() == current)[0];
                    object.parent.emit("functionEvent", object.parent.generateInformationEvent(object.function, "information", object.storedInformation.currentItem.title));

                })
                .catch(err => { return });
        }, 3000);

        // Compute data and send to frontend every second (update clock)
        this.computeData = setInterval(function () {

            if (!object.storedInformation.currentItem) {
                object.storedInformation.timeLeftSec = null;
            } else {
                object.storedInformation.timeLeftSec = parseInt(((object.storedInformation.currentItem.duration * 1000) + object.storedInformation.startedAt - Date.now()) / 1000);
            }

            object.parent.emit("functionEvent", object.parent.generateInformationEvent(object.function, "informationChange", object.storedInformation));
            console.log(object.storedInformation);
        }, 1000);
    };


    //Attempt connection
    this.connect = async function () {

        // Read settings on startup
        await this.readSettings();

        var object = this;

        // Initialise Fluro object

        if (!this.enabled) { return; }

        object.fluro = new Fluro({
            apiURL: API_URL,
            applicationToken: object.apiKey
        });

        object.fluro.date.defaultTimezone = 'Australia/Melbourne';

        // Initiate first fetch
        object.fetch();

    }

    //Convert date to AM PM
    this.formatAMPM = function (date) {
        var hour = date.getHours() % 12;
        var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        var amPM = date.getHours() >= 12 ? "PM" : "AM";
        return "" + hour + ":" + minutes + ":" + seconds + " " + amPM;
    }

    //Write the settings file though a prompt (used for the install script)
    this.writeSettingsPrompt = function () {
        var object = this;
        callback = function (values, callback) {
            object.writeSettings("true", values[0], values[1], values[2], values[3], values[4], values[5], callback);
        }
        return { "values": ["API Key", "Realm", "Track", "Date", "eventID", "planID"], "callback": callback };
    }

    //Write the current settings to file
    this.writeSettings = function (enabled, apiKey, realm, track, date, eventID, planID, roomIDs, timezone, callback) {
        var object = this;
        var settings = "Church Clocks Fluro Configuration File\n\n";
        settings += "enabled=" + (enabled || "false") + "\n";
        settings += "apiKey=" + (apiKey || "") + "\n";
        settings += "realm=" + (realm || "") + "\n";
        settings += "track=" + (track || "") + "\n";
        settings += "date=" + (date || "") + "\n";
        settings += "eventID=" + (eventID || "") + "\n";
        settings += "planID=" + (planID || "") + "\n";
        settings += "roomIDs=" + (roomIDs || "") + "\n";
        settings += "timezone=" + (timezone || "Melbourne/Australia") + "\n";

        fs.writeFile(this.filePath + "fluroSettings.txt", settings, "utf-8", function (err) {
            if (err) { object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to read/write the settings file")); if (callback) { callback(false); } }
            else {
                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was written successfully"));
                if (callback) { callback(true); }
            }
        });
    }

    this.readSettings = async function (callback) {
        var object = this;
        try {
            var data = fs.readFileSync(this.filePath + "fluroSettings.txt");
            try {
                object.enabled = data.toString().split("enabled=")[1].split("\n")[0] == "true";
                object.apiKey = data.toString().split("apiKey=")[1].split("\n")[0];
                object.realm = data.toString().split("realm=")[1].split("\n")[0];
                object.track = data.toString().split("track=")[1].split("\n")[0];
                object.date = data.toString().split("date=")[1].split("\n")[0];
                object.eventID = data.toString().split("eventID=")[1].split("\n")[0];
                object.planID = data.toString().split("planID=")[1].split("\n")[0];
                object.roomIds = data.toString().split("roomIDs=")[1].split("\n")[0];
                object.timezone = data.toString().split("timezone=")[1].split("\n")[0];


                if (object.apiKey === undefined || object.realm === undefined) {
                    throw "invalid settings read";
                }

                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was read successfully"));
                if (callback) { callback(true); }

            }
            catch (e) {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file was corrupt so it has been recreated"));
                object.writeSettings("false", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, function (success) {
                    if (success == true) {
                        object.readSettings(object, callback);
                    }
                });
            }
        }
        catch (e) {
            switch (e.code) {
                case "ENOENT": {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file didn't exist, creating it"));
                    object.writeSettings("false", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, function (success) {
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