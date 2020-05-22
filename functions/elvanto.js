const fs = require("fs");
const puppeteer = require('puppeteer');
module.exports = function() {
    this.function = "elvanto";
    this.parent = undefined;
    this.storedInformation = {};
    this.connected = false;
    this.updaterInterval = undefined;
    this.run = false;

    this.elvantoURL = "";
    this.serviceId = "";
    this.username = "";
    this.password = "";
    this.puppeteerExecutablePath = "";

    //Main web grabber.
    async function main(object) {
        //Open browser
        object.parent.emit("information", object.parent.generateInformationEvent(object.function, "grabber", "Opened grabber"));

        var puppeteerArgs = {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']};
        if(object.puppeteerExecutablePath !== "default") {
            puppeteerArgs["executablePath"] = object.puppeteerExecutablePath;
        }

        var browser = await puppeteer.launch(puppeteerArgs);
        var page = await browser.newPage();
        object.run = true;

        //Open url and navigate to the current live page
        try {
            //https://kardiniachurch.elvanto.com.au/live/?id=' + object.serviceId + '&time_id=' + object.serviceTime
            object.parent.emit("information", object.parent.generateInformationEvent(object.function, "grabber", "Attempting to login to Elvanto"));
            await page.goto(object.elvantoURL + "live/" + object.serviceId, { waitUntil: 'networkidle0' });
            await page.type('#member_username', object.username);
            await page.type('#member_password', object.password);
            await Promise.all([
                    page.click('.btn-submit'),
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
            ]);


            //Check if we are logged in
            if(await page.evaluate(() => Elvanto.url.site.includes("login") === false)) {
                while(object.run == true) {
                    object.storedInformation.timeLeftSec = await page.evaluate(() => window.Live.countdownSeconds);
                    object.storedInformation.servicePlanItems = await page.evaluate(() => window.Live.servicePlanItems);
                    object.storedInformation.currentPlanItem = await page.evaluate(() => window.Live.currentPlanItem);
                    object.storedInformation.serviceId = await page.evaluate(() => window.Live.serviceId);
                    object.storedInformation.timeId = await page.evaluate(() => window.Live.timeId);
                    object.storedInformation.serviceStartTime = await page.evaluate(() => window.Live.serviceStartTime);
                    object.storedInformation.serviceStarted = await page.evaluate(() => window.Live.serviceStarted);
                    object.storedInformation.serviceStartsOriginal = await page.evaluate(() => window.Live.serviceStartsOriginal);

                    //Find the current item
                    var position = 0;
                    for(var i in object.storedInformation.servicePlanItems) {
                        position++;
                        if(i == object.storedInformation.currentPlanItem.id) {
                            object.storedInformation.nextPlanItem = object.storedInformation.servicePlanItems[Object.keys(object.storedInformation.servicePlanItems)[position]];

                            //If it's not an item grab the next one (titles are included as items)
                            while(object.storedInformation.nextPlanItem.start === undefined && position < Object.keys(object.storedInformation.servicePlanItems).length) {
                                object.storedInformation.nextPlanItem = object.storedInformation.servicePlanItems[Object.keys(object.storedInformation.servicePlanItems)[position++]];
                            }
                            break;
                        }
                    }
                    
                    object.parent.emit("functionEvent", object.parent.generateInformationEvent(object.function, "informationChange", object.storedInformation));
                    await delay(500);
                }
            }
            else {
                //Failed to login
                object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Failed to login! Please check your Elvanto login details"));
            }
        }
        catch(e) {
            object.parent.emit("error", object.parent.generateErrorState(object.function, "critical", "Invalid service or other error cannot proceed: " + e));
        }

        object.parent.emit("information", object.parent.generateInformationEvent(object.function, "grabber", "Exited grabber"));
        browser.close();
    };

    //Delay
    async function delay(ms) {
        return await new Promise(resolve => setTimeout(resolve, ms));
    }

    //On connection change
    this.connectionChange = function(state, forceAttemptReconnection=false) {
        if(state != this.connected || forceAttemptReconnection == true) {    
            var object = this;
            var friendlyState = "disconnected";
            this.connected = state;
            if(state == true){friendlyState = "connected";}
            this.parent.emit("connectionState", this.parent.generateConnectionState(this.function, friendlyState));

            if(state == false || forceAttemptReconnection == true) {
                clearTimeout(this.connectionTimeout);
                clearInterval(this.updaterInterval);
                this.connectionTimeout = setTimeout(function() {
                    object.connect();
                }, 5000);
            }
        }
    }

    //Handle incoming requests
    this.handleIncoming = function(message) {
        if(message === undefined){return false;}
        if(message.function == "elvanto") {
            switch(message.command) {
                case "setService": {
                    this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "Setting service"));
                    this.serviceId = message.value;
                    this.run = true;
                    main(this);
                    return true;
                }
                case "clearService": {
                    this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "Clearing service"));
                    this.run = false;
                    break;
                }
            }
        }
    }

    //Attempt to setup
    this.setup = function(parent) {
        this.parent = parent;
    }

    //Attempt connection
    this.connect = function() {
        var object = this;
        this.parent.emit("connectionStatus", this.parent.generateConnectionState(this.function, "standby"));
        this.parent.emit("information", this.parent.generateInformationEvent(this.function, "information", "readingSettings"));
        this.readSettings();
    }

    //Write the current settings to file
    this.writeSettings = function(elvantoURL, user, password, callback, puppeteerExecutablePath = "") {
        var object = this;
        var settings = "Church Clocks Elvanto Configuration File\n\n";
        settings += "elvantoURL=" + elvantoURL + "\n";
        settings += "username=" + user + "\n";
        settings += "password=" + password + "\n";
        settings += "puppeteerExecutablePath=" + puppeteerExecutablePath + "\n";    

        //Check the directory exists
        if (!fs.existsSync("./settings")){
            fs.mkdirSync("./settings");
        }
        
        fs.writeFileSync("./settings/elvantoSettings.txt", settings, "utf-8", function (err) {
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
            var data = fs.readFileSync("./settings/elvantoSettings.txt");
            try {
                object.elvantoURL = data.toString().split("elvantoURL=")[1].split("\n")[0];
                object.username = data.toString().split("username=")[1].split("\n")[0];
                object.password = data.toString().split("password=")[1].split("\n")[0];
                object.puppeteerExecutablePath =  data.toString().split("puppeteerExecutablePath=")[1].split("\n")[0];


                if(object.elvantoURL === undefined || object.username === undefined || object.password === undefined || object.puppeteerExecutablePath === undefined){
                    throw "invalid settings read";
                }

                object.parent.emit("information", object.parent.generateInformationEvent(object.function, "information", "Settings file was read successfully"));
                if(callback){callback(true);}
            }
            catch(e) {
                object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file was corrupt so it has been recreated"));
                object.writeSettings("<YOUR_ELVANTO_URL_HERE eg http://church.elvanto.com/>", "<YOUR_USERNAME_HERE>", "<YOUR_PASSWORD_HERE>"); 
                object.readSettings(object, callback);
            }
        }
        catch(e) {
            switch(e.code) {
                case "ENOENT": {
                    object.parent.emit("error", object.parent.generateErrorState(object.function, "warning", "Settings file didn't exist, creating it"));
                    object.writeSettings("<YOUR_ELVANTO_HOME_URL_HERE eg http://church.elvanto.com/>", "<YOUR_USERNAME_HERE>", "<YOUR_PASSWORD_HERE>", function(success) {
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