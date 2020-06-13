window.onload = function () {
    var ws = undefined;
    var connected = true;
    var params = new URLSearchParams(window.location.search);
    var reconnectAttemper = undefined;
    var flasher = undefined;

    //Set the element based off the function
    switch(params.get("type")) {
        case "current_time": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineClock").style.display = "block";
            break;
        }
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
        case "pvp_video_clock":
        case "pp_video_clock": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineClock").style.display = "block";
            break;
        }
        case "pvpandpp_video_clock": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineClock").style.display = "block";
            break;
        }
        case "pp_lyric_next":
        case "pp_lyric_current": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineText").style.display = "block";
            break;
        }
        case "debug": {
            document.getElementById("unsupported").style.display = "none";
            document.getElementById("singleLineText").style.display = "block";
        }
    }

    var connectionChanged = function(state) {
        connected = state;

        clearInterval(flasher);
        if(connected == false) {
            flasher = setInterval(function() {
                if(document.getElementById("body").style.backgroundColor != "1vw solid red") {
                    document.getElementById("body").style.border = "1vw solid red";
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
            clearTimeout(reconnectAttemper);
            reconnectAttemper = setTimeout(function(){openSocket()}, 5000);
        }

        ws.onclose = function() {
            connectionChanged(false);
            clearTimeout(reconnectAttemper);
            reconnectAttemper = setTimeout(function(){openSocket()}, 5000);
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
                    //If debug is enabled
                    if(params.get("type") == "debug") {
                        document.getElementById("singleLineTextValue").innerHTML = "debug active";
                        console.log("Data: (Event: " + msg.event + ", Func: " + msg.value.function + ", Type: " + msg.value.type + ")");
                        console.log(msg.value.value)
                    }

                    switch(params.get("type")) {
                        case "current_time": {
                            if(msg.value.function == "systemtime" && msg.value.type == "informationChange") {
                                document.getElementById("singleLineClockValue").innerHTML = msg.value.value;
                            }
                            break;
                        }
                        case "elvanto_countdown_clock": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false && msg.value.value.timeLeftSec !== undefined && msg.value.value.timeLeftSec !== false) {

                                    //Set the colour
                                    if(msg.value.value.timeLeftSec > 30) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning";
                                    }
                                    else if(msg.value.value.timeLeftSec > 0) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-almost";
                                    }
                                    else if(msg.value.value.timeLeftSec < 0) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-over";
                                    }

                                    document.getElementById("singleLineClockValue").innerHTML = convertTime(msg.value.value.timeLeftSec);
                                }
                                else {
                                    document.getElementById("singleLineClockValue").className = "timerPaused";
                                    document.getElementById("singleLineClockValue").innerHTML = "--:--:--";
                                }
                            }
                            break;
                        }
                        case "elvanto_currentitem": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false && msg.value.value.currentPlanItem !== undefined && msg.value.value.currentPlanItem !== false) {
                                    document.getElementById("singleLineTextValue").innerHTML = msg.value.value.currentPlanItem.name;
                                }
                                else {
                                    document.getElementById("singleLineTextValue").innerHTML = "-";
                                }
                            }
                            break;
                        }
                        case "elvanto_nextitem": {
                            if(msg.value.function == "elvanto" && msg.value.type == "informationChange") {
                                if(isEmpty(msg.value.value) == false && msg.value.value.nextPlanItem !== undefined && msg.value.value.nextPlanItem !== false) {
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
                                if(isEmpty(msg.value.value) == false && msg.value.value.currentPlanItem !== undefined && msg.value.value.currentPlanItem !== false && msg.value.value.nextPlanItem !== undefined && msg.value.value.nextPlanItem !== false) {
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
                        case "pvp_video_clock": {
                            if(msg.event == "functionEvent") {
                                if(msg.value.function == "proVideoPlayer" && msg.value.type == "informationChange") {
                                    if(msg.value.value !== undefined) {
                                        if(msg.value.value.transportStates !== {}) {
                                            var transportId = params.get("pvp_transportid");
                                            if(transportId === null){console.log("ERROR: You need a transport id!");}
                                            if(msg.value.value.transportStates.data[transportId] !== undefined) {
                                                var isPlaying = msg.value.value.transportStates.data[transportId].transportState.isPlaying;
                                                var timeRemaining = msg.value.value.transportStates.data[transportId].transportState.timeRemaining;

                                                if(sessionStorage.getItem("pvpValues") !== null && timeRemaining === JSON.parse(sessionStorage.getItem("pvpValues")).timeRemaining){isPlaying = false;}
                                                sessionStorage.setItem("pvpValues", JSON.stringify({
                                                    "isPlaying": isPlaying,
                                                    "timeRemaining": timeRemaining
                                                }));
                                            }
                                        }
                                    }
                                }
                            }

                            if(sessionStorage.getItem("pvpValues") === null) {
                                sessionStorage.setItem("pvpValues", JSON.stringify({"isPlaying": false, "timeRemaining": 0}));
                            }

                            var currentTimeSec = -1;
                            var isPaused = false;
                            try {var pvp = JSON.parse(sessionStorage.getItem("pvpValues"));} catch(e) {var pvp = {"isPlaying": false, "timeRemaining": 0}}

                            if(pvp.isPlaying == true) {
                                currentTimeSec = pvp.timeRemaining;
                            }
                            else {
                                isPaused = true;
                                if(pvp.timeRemaining == 0){currentTimeSec = -1;}
                                else {currentTimeSec = pvp.timeRemaining;}
                            }

                            if(currentTimeSec !== -1) {
                                //Set the colour
                                if(isPaused == true) {
                                    document.getElementById("singleLineClockValue").className = "timerPaused";
                                }
                                else {
                                    if(currentTimeSec > 15) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning";
                                    }
                                    else if(currentTimeSec > 10) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-almost";
                                    }
                                    else if(currentTimeSec > 0) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-over";
                                    }
                                }

                                document.getElementById("singleLineClockValue").innerHTML = convertTime(currentTimeSec);
                            }
                            else {
                                document.getElementById("singleLineClockValue").className = "timerPaused";
                                document.getElementById("singleLineClockValue").innerHTML = "--:--:--";
                            } 
                            break;
                        }
                        case "pp_video_clock": {
                            if(msg.value.function == "proPresenter" && msg.value.type == "informationChange") {
                                if(msg.value.value !== undefined) {
                                    if(msg.value.value.vid !== undefined) {
                                        var timeRemaining = msg.value.value.vid.txt;
                                        var timeRemainingSec = (parseInt(timeRemaining.split(":")[0]) * 3600) + (parseInt(timeRemaining.split(":")[1]) * 60) + parseInt(timeRemaining.split(":")[2]);
                                        var isPlaying = true;
                                        var checkPlay = JSON.parse(sessionStorage.getItem("ppValues")).checkPlay;

                                        if(isNaN(timeRemainingSec)){isPlaying = false;}
                                        if(sessionStorage.getItem("ppValues") !== null && timeRemainingSec === JSON.parse(sessionStorage.getItem("ppValues")).timeRemaining) {
                                            if(JSON.parse(sessionStorage.getItem("ppValues")).checkPlay === undefined) {
                                                checkPlay = true;
                                            }
                                            else {
                                                isPlaying = false;
                                            }
                                        }
                                        else {checkPlay = undefined;}

                                        if(timeRemaining === "--:--:--"){timeRemainingSec = -1;}
                                        sessionStorage.setItem("ppValues", JSON.stringify({
                                            "isPlaying": isPlaying,
                                            "timeRemaining": timeRemainingSec,
                                            "checkPlay": checkPlay
                                        }));
                                    }
                                }
                            }

                            if(sessionStorage.getItem("ppValues") === null) {
                                sessionStorage.setItem("ppValues", JSON.stringify({"isPlaying": false, "timeRemaining": 0, "checkPlay": undefined}));
                            }

                            var currentTimeSec = -1;
                            var isPaused = false;
                            try {var pp = JSON.parse(sessionStorage.getItem("ppValues"));} catch(e) {var pp = {"isPlaying": false, "timeRemaining": 0}}
                            
                            if(pp.isPlaying == true) {
                                currentTimeSec = pp.timeRemaining;
                            }
                            else {
                                isPaused = true;
                                currentTimeSec = pp.timeRemaining;
                            }

                            if(currentTimeSec !== -1) {
                                //Set the colour
                                if(isPaused == true) {
                                    document.getElementById("singleLineClockValue").className = "timerPaused";
                                }
                                else {
                                    if(currentTimeSec > 15) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning";
                                    }
                                    else if(currentTimeSec > 10) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-almost";
                                    }
                                    else if(currentTimeSec > 0) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-over";
                                    }
                                }

                                document.getElementById("singleLineClockValue").innerHTML = convertTime(currentTimeSec);
                            }
                            else {
                                document.getElementById("singleLineClockValue").className = "timerPaused";
                                document.getElementById("singleLineClockValue").innerHTML = "--:--:--";
                            } 
                            break;
                        }
                        case "pvpandpp_video_clock": {
                            if(msg.event == "functionEvent") {
                                if(msg.value.function == "proVideoPlayer" && msg.value.type == "informationChange") {
                                    if(msg.value.value !== undefined) {
                                        if(msg.value.value.transportStates !== {}) {
                                            var transportId = params.get("pvp_transportid");
                                            if(transportId === null){console.log("ERROR: You need a transport id!");}
                                            if(msg.value.value.transportStates.data[transportId] !== undefined) {
                                                var isPlaying = msg.value.value.transportStates.data[transportId].transportState.isPlaying;
                                                var timeRemaining = msg.value.value.transportStates.data[transportId].transportState.timeRemaining;

                                                if(sessionStorage.getItem("pvpValues") !== null && timeRemaining === JSON.parse(sessionStorage.getItem("pvpValues")).timeRemaining){isPlaying = false;}
                                                sessionStorage.setItem("pvpValues", JSON.stringify({
                                                    "isPlaying": isPlaying,
                                                    "timeRemaining": timeRemaining
                                                }));
                                            }
                                        }
                                    }
                                }
                                if(msg.value.function == "proPresenter" && msg.value.type == "informationChange") {
                                    if(msg.value.value !== undefined) {
                                        if(msg.value.value.vid !== undefined) {
                                            var timeRemaining = msg.value.value.vid.txt;
                                            var timeRemainingSec = (parseInt(timeRemaining.split(":")[0]) * 3600) + (parseInt(timeRemaining.split(":")[1]) * 60) + parseInt(timeRemaining.split(":")[2]);
                                            var isPlaying = true;
                                            try {var checkPlay = JSON.parse(sessionStorage.getItem("ppValues")).checkPlay;}catch(e){var checkPlay = undefined;}

                                            if(isNaN(timeRemainingSec)){isPlaying = false;}
                                            if(sessionStorage.getItem("ppValues") !== null && timeRemainingSec === JSON.parse(sessionStorage.getItem("ppValues")).timeRemaining) {
                                                if(JSON.parse(sessionStorage.getItem("ppValues")).checkPlay === undefined) {
                                                    checkPlay = true;
                                                }
                                                else {
                                                    isPlaying = false;
                                                }
                                            }
                                            else {checkPlay = undefined;}

                                            if(timeRemaining === "--:--:--"){timeRemainingSec = -1;}
                                            sessionStorage.setItem("ppValues", JSON.stringify({
                                                "isPlaying": isPlaying,
                                                "timeRemaining": timeRemainingSec,
                                                "checkPlay": checkPlay
                                            }));
                                        }
                                    }
                                }
                            }

                            var currentTimeSec = -1;
                            var mainClock = params.get("main_clock");

                            //Check if information is set, if not default
                            if(sessionStorage.getItem("pvpValues") === null) {
                                sessionStorage.setItem("pvpValues", JSON.stringify({"isPlaying": false, "timeRemaining": 0}));
                            }
                            if(sessionStorage.getItem("ppValues") === null) {
                                sessionStorage.setItem("ppValues", JSON.stringify({"isPlaying": false, "timeRemaining": 0, "checkPlay": undefined}));
                            }

                            var isPaused = false;
                            if(mainClock === null || mainClock === "pvp") {
                                //PVP Main
                                try {var pvp = JSON.parse(sessionStorage.getItem("pvpValues"));} catch(e) {var pvp = {"isPlaying": false, "timeRemaining": 0}}
                                try {var pp = JSON.parse(sessionStorage.getItem("ppValues"));} catch(e) {var pp = {"isPlaying": false, "timeRemaining": 0}}

                                if(pvp.isPlaying == true) {
                                    currentTimeSec = pvp.timeRemaining;
                                }
                                else if(pp.isPlaying == true) {
                                    currentTimeSec = pp.timeRemaining;
                                }
                                else {
                                    isPaused = true;
                                    if(pvp.timeRemaining == 0){currentTimeSec = -1;}
                                    else {currentTimeSec = pvp.timeRemaining;}
                                }
                            }
                            else {
                                //PP Main
                                try {var pvp = JSON.parse(sessionStorage.getItem("pvpValues"));} catch(e) {var pvp = {"isPlaying": false, "timeRemaining": 0}}
                                try {var pp = JSON.parse(sessionStorage.getItem("ppValues"));} catch(e) {var pp = {"isPlaying": false, "timeRemaining": 0}}

                                if(pp.isPlaying == true) {
                                    currentTimeSec = pp.timeRemaining;
                                }
                                else if(pvp.isPlaying == true) {
                                    currentTimeSec = pvp.timeRemaining;
                                }
                                else {
                                    isPaused = true;
                                    currentTimeSec = pp.timeRemaining;
                                }
                            }

                            if(currentTimeSec !== -1) {
                                //Set the colour
                                if(isPaused == true) {
                                    document.getElementById("singleLineClockValue").className = "timerPaused";
                                }
                                else {
                                    if(currentTimeSec > 15) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning";
                                    }
                                    else if(currentTimeSec > 10) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-almost";
                                    }
                                    else if(currentTimeSec > 0) {
                                        document.getElementById("singleLineClockValue").className = "timerRunning-over";
                                    }
                                }

                                document.getElementById("singleLineClockValue").innerHTML = convertTime(currentTimeSec);
                            }
                            else {
                                document.getElementById("singleLineClockValue").className = "timerPaused";
                                document.getElementById("singleLineClockValue").innerHTML = "--:--:--";
                            } 
                            break;
                        }
                        case "pp_lyric_next": {
                            if(msg.event == "functionEvent") {
                                if(msg.value.function == "proPresenter" && msg.value.type == "informationChange") {
                                    try { 
                                        var lyric = msg.value.value.ns.txt;
                                        document.getElementById("singleLineTextValue").innerHTML = "<h1>" + lyric + "</h1>";
                                    }
                                    catch(e){
                                        document.getElementById("singleLineTextValue").innerHTML = "<h1>-</h1>";
                                    }
                                }
                            }
                            break;
                        }
                        case "pp_lyric_current": {
                            if(msg.event == "functionEvent") {
                                if(msg.value.function == "proPresenter" && msg.value.type == "informationChange") {
                                    try { 
                                        var lyric = msg.value.value.cs.txt;
                                        document.getElementById("singleLineTextValue").innerHTML = "<h1>" + lyric + "</h1>";
                                    }
                                    catch(e){
                                        document.getElementById("singleLineTextValue").innerHTML = "-";
                                    }
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
        }

        //Set text color
        if(params.get("color") !== null) {
            for(var i = 0; i < document.getElementsByTagName("h1").length; i++) {
                document.getElementsByTagName("h1")[i].style.color = params.get("color").replace('*', '#');
            }
        }

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