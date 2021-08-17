module.exports = function() {
    this.function = "systemtime";
    this.parent = undefined;
    this.dateSender = undefined;
    this.previousDate = undefined;
    this.enabled = true;

    //Not required
    this.setFilePath = function(filePath) {
        this.filePath = filePath;
    }

    //Attempt to setup
    this.setup = function(parent) {
        this.parent = parent;
    }

    //Attempt connection
    this.connect = function() {
        var object = this;
        clearInterval(this.dateSender);
        this.dateSender = setInterval(function() {
            var date = object.formatAMPM(new Date());
            if(this.previousDate != date) {
                this.previousDate = date;    
                object.parent.emit("functionEvent", object.parent.generateInformationEvent(object.function, "informationChange", date));
            }
        }, 200);
    }

    //Convert date to AM PM
    this.formatAMPM = function(date) {
        var hour = date.getHours() % 12;
        var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        var amPM = date.getHours() >= 12 ? "PM" : "AM";
        return "" + hour + ":" + minutes + ":" + seconds + " " + amPM;
    }

    //Write the settings file though a prompt (used for the install script)
    this.writeSettingsPrompt = function() {
        var object = this;
        callback = function (values, callback) {
        }
        return { "values": ["No settings just hit enter :)"], "callback": callback };
    }
}