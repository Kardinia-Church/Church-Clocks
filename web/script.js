window.onload = function () {
    var ws = undefined;
    var connected = true;
    var params = new URLSearchParams(window.location.search);
    var flasher = undefined;

    //Set the element based off the function
    switch(params.get("type")) {
        case "elvanto_countdown_clock": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineClock").style.display = "block";
            break;
        }
        case "elvanto_currentitem":
        case "elvanto_nextitem": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineText").style.display = "block";
            break;
        }
        case "elvanto_items": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("multiLineText").style.display = "block";
            break;
        }
    }

    var connectionChanged = function(state) {
        connected = state;

        clearInterval(flasher);
        if(connected == false) {
            flasher = setInterval(function() {
                if(document.getElementById("body").style.border != "5vh solid red") {
                    document.getElementById("body").style.border = "5vh solid red";
                }     
                else {
                    document.getElementById("body").style.border = "none";
                }   
            }, 1000);
        }
        else {
            document.getElementById("body").style.border = "none";
        }
    }

    //Open the websocket and set events
    var openSocket = function() {
        if(window.location.protocol == "http:") {
            ws = new WebSocket("ws://" + window.location.host.split(':')[0] + ":" + 9955);
        }
        else if(window.location.protocol == "https:") {
            ws = new WebSocket("wss://" + window.location.host.split(':')[0] + ":" + 9955);
        }

        //On ws error
        ws.onerror = function() {
            console.log("Websocket Error");
            connectionChanged(false);
            setTimeout(function(){openSocket()}, 5000);
        }

        ws.onclose = function() {
            connectionChanged(false);
            setTimeout(function(){openSocket()}, 5000);
        }

        //On WS open
        ws.onopen = function() {
            if(connected == false) {
                connectionChanged(true);
            }
        }

        //On WS message
        ws.onmessage = function(message) {
            var msg = JSON.parse(message.data);

            //Setup events
            switch(msg.event) {
                case "information": {
                    console.log("Information: (" + msg.value.function + ", " + msg.value.type + ") - " + msg.value.value);
                    break;
                }
                case "connectionStatus": {
                    console.log("Connection Status: (" + msg.value.function + ") -" + msg.value.state);
                    break;
                }
                case "error": {
                    console.log("ERROR: (" + msg.value.function + ", " + msg.value.type + ") - " + msg.value.error);
                    break;
                }
                case "functionEvent": {
                    switch(params.get("type")) {
                        case "elvanto_countdown_clock": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false) {
                                    document.getElementById("singleLineClockValue").innerHTML = convertTime(msg.value.value.timeLeftSec);
                                }
                                else {
                                    document.getElementById("singleLineClockValue").innerHTML = "--:--:--";
                                }
                            }
                            break;
                        }
                        case "elvanto_currentitem": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false  && msg.value.value.nextPlanItem !== undefined) {
                                    document.getElementById("singleLineTextValue").innerHTML = msg.value.value.currentPlanItem.name;
                                }
                                else {
                                    document.getElementById("multiLineTextValue").innerHTML = "-";
                                }
                            }
                            break;
                        }
                        case "elvanto_nextitem": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false && msg.value.value.nextPlanItem !== undefined) {
                                    document.getElementById("singleLineTextValue").innerHTML = msg.value.value.nextPlanItem.name;
                                }
                                else {
                                    document.getElementById("singleLineTextValue").innerHTML = "-";
                                }
                            }
                            break;
                        }
                        case "elvanto_items": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false && msg.value.value.nextPlanItem !== undefined && msg.value.value.currentPlanItem !== undefined) {
                                    document.getElementById("multiLineTextValue").innerHTML = "";
                                    document.getElementById("multiLineTextValue").innerHTML += "<h1>" + msg.value.value.currentPlanItem.name + "</h1>";
                                    document.getElementById("multiLineTextValue").innerHTML += "<h1>" + msg.value.value.nextPlanItem.name + "</h1>";
                                }
                                else {
                                    document.getElementById("multiLineTextValue").innerHTML = "<h1>-</h1>";
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }

    connectionChanged(false);
    openSocket();

    if(document.getElementById("unsupported").style.display == "none") {
        //Adjust page attributes 
        if(params.get("backgroundcolor") !== null) {
            document.getElementsByTagName("html")[0].style.backgroundColor = params.get("backgroundcolor").replace('*', '#');
        };

        //Scale text
        if(params.get("scale") !== null) {
            for(var i = 0; i < document.getElementsByTagName("h1").length; i++) {
                document.getElementsByTagName("h1")[i].style.fontSize = params.get("scale");
            }
        }

        //Font
        if(params.get("font") !== null) {
            for(var i = 0; i < document.getElementsByTagName("h1").length; i++) {
                document.getElementsByTagName("h1")[i].style.fontFamily = params.get("font");
            }
        }
    }
}

//Convert seconds to --:--:-- string
function convertTime(seconds) {
    var wasInverted = false;
    if(seconds < 0) {seconds = -seconds; wasInverted = true;}
    hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    minutes = ("0" + Math.floor(seconds / 60)).slice(-2);
    seconds = ("0" + Math.floor(seconds % 60)).slice(-2);
    
    if(wasInverted == false) {
        return hours + ":" + minutes + ":" + seconds;
    }
    else {
        return "-" + hours + ":" + minutes + ":" + seconds;
    }
}

//Convert date to AM PM
function formatAMPM(date) {
    return "" + date.getHours() & 12 + ":" + date.getMinutes() < 10 ? "0" + minutes : minutes + " " + date.getHours() >= 12 ? "PM" : "AM";
}

function isEmpty(obj) {
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop)) {
        return false;
      }
    }
  
    return JSON.stringify(obj) === JSON.stringify({});
  }