var ws = undefined;
var wsPort = 9955;
var reconnectAttemper = undefined;
var func = undefined;
var setPlanId = undefined;

//When the window loads
window.onload = function () {
    openSocket(function (connected) {
        console.log("Web socket state = " + connected);
    });
}

//Attempt to login
function login() {
    if (ws.readyState != ws.OPEN) {
        alert("Cannot login as we're not connected to the server, please try refreshing the page or wait a minute");
    }
    else {
        //Attempt to send our request to get services. If this fails we can assume the password is incorrect
        send(JSON.stringify({
            "password": document.getElementById("password").value,
            "function": "fluro",
            "command": "getEvents",
            "value": ""
        }));
    }
}

//Open the websocket
var openSocket = function (connectionCallback) {
    if (window.location.protocol == "http:") {
        ws = new WebSocket("ws://" + window.location.host.split(':')[0] + ":" + wsPort);
    }
    else if (window.location.protocol == "https:") {
        ws = new WebSocket("wss://" + window.location.host.split(':')[0] + ":" + wsPort);
    }

    //On ws error
    ws.onerror = function () {
        console.log("Websocket Error");
        clearTimeout(reconnectAttemper);
        reconnectAttemper = setTimeout(function () { openSocket(connectionCallback) }, 5000);
        connectionCallback(false);
    }

    ws.onclose = function () {
        clearTimeout(reconnectAttemper);
        reconnectAttemper = setTimeout(function () { openSocket(connectionCallback) }, 5000);
        connectionCallback(false);
    }

    ws.onopen = function () {
        connectionCallback(true);
    }

    //On WS message
    ws.onmessage = function (message) {
        message = JSON.parse(message.data);
        switch (message.event) {
            case "configuration": {
                if (message.value.function == "fluro" && message.value.type == "events") {
                    if (message.value.value == "Event set") {
                        alert("The event was set!");
                        if(setPlanId) {
                            window.location.href = "https://live.fluro.io/plan/" + setPlanId;
                        }
                    }
                    else {
                        document.getElementById("login").style.display = "none";
                        var events = document.getElementById("events");
                        events.innerHTML = "<h1>Please Select an Event</h1>";

                        for (var i in message.value.value) {
                            var element = document.createElement("div");
                            element.classList.add("serviceButton");
                            element.innerHTML += "<h2>" + message.value.value[i].title + "</h2>";
                            element.innerHTML += "<p>" + new Date(message.value.value[i].startDate).toDateString() + "</p>";
                            element.setAttribute("id", message.value.value[i]._id);
                            element.setAttribute("planId", message.value.value[i].plans[0]._id);
                            element.onclick = function (event) {
                                setPlanId = event.target.getAttribute("planId") || event.target.parentElement.getAttribute("planId");
                                send(JSON.stringify({
                                    "password": document.getElementById("password").value,
                                    "function": "fluro",
                                    "command": "setEvent",
                                    "value": event.target.getAttribute("id") || event.target.parentElement.getAttribute("id")
                                }));
                            }
                            events.appendChild(element);
                        }

                        var clearButton = document.createElement("div");
                        clearButton.classList.add("serviceButton");
                        clearButton.innerHTML += "<h2>Clear Clock</h2>";
                        clearButton.innerHTML += "<p></p>";
                        clearButton.onclick = function (event) {
                            send(JSON.stringify({
                                "password": document.getElementById("password").value,
                                "function": "fluro",
                                "command": "clearClock",
                                "value": ""
                            }));
                        }
                        events.appendChild(clearButton);
                    }
                }
                break;
            }
            case "error": {
                if (message.value.function == "fluro" && message.value.type == "authenticationError") {
                    alert("Sorry that password was incorrect");
                }
                break;
            }

        }
    }
}

//Send a message
function send(message) {
    if (ws.readyState != ws.OPEN) {
        console.log("Websocket is not open it is in " + ws.readyState);
        alert("Could not send the message because we are disconnected.");
        location.reload();
    }
    else {
        ws.send(message);
    }
}