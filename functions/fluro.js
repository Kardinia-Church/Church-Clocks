const Fluro = require('fluro');
const fs = require('fs');

const API_URL = "https://api.fluro.io";

module.exports = function () {

    this.function = "fluro";
    this.parent = undefined;
    this.storedInformation = {};
    this.connected = false;
    this.updaterInterval = undefined;
    this.run = false;


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
                values: ['active', 'archived', 'draft'],
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
            timezone: 'Australia/Melbourne'
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
        }, 1000);
    };


    //Attempt connection
    this.connect = async function () {

        // Read settings on startup
        await this.readSettings();

        var object = this;

        // Initialise Fluro object
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
            object.writeSettings(values[0], values[1], values[2], values[3], values[4], values[5], callback);
        }
        return { "values": ["API Key", "Realm", "Track", "Date", "eventID", "planID"], "callback": callback };
    }

    //Write the current settings to file
    this.writeSettings = function (apiKey, realm, track, date, eventID, planID, callback) {
        var object = this;
        var settings = "Church Clocks Fluro Configuration File\n\n";
        settings += "apiKey=" + apiKey + "\n";
        settings += "realm=" + realm + "\n";
        settings += "track=" + track + "\n";
        settings += "date=" + date + "\n";
        settings += "eventID=" + eventID + "\n";
        settings += "planID=" + planID + "\n";

        fs.writeFileSync(this.filePath + "fluroSettings.txt", settings, "utf-8", function (err) {
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
                object.apiKey = data.toString().split("apiKey=")[1].split("\n")[0];
                object.realm = data.toString().split("realm=")[1].split("\n")[0];
                object.track = data.toString().split("track=")[1].split("\n")[0];
                object.date = data.toString().split("date=")[1].split("\n")[0];
                object.eventID = data.toString().split("eventID=")[1].split("\n")[0];
                object.planID = data.toString().split("planID=")[1].split("\n")[0];


                if (object.apiKey === undefined || object.realm === undefined) {
                    throw "invalid settings read";
                }

                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was read successfully"));
                if (callback) { callback(true); }

            }
            catch (e) {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file was corrupt so it has been recreated"));
                object.writeSettings("<API_KEY_HERE>", "<SPECIFY_REALM_HERE>", undefined, undefined, undefined, undefined);
                object.readSettings(object, callback);
            }
        }
        catch (e) {
            switch (e.code) {
                case "ENOENT": {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file didn't exist, creating it"));
                    object.writeSettings("<API_KEY_HERE>", "<SPECIFY_REALM_HERE>", undefined, undefined, undefined, undefined, function (success) {
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