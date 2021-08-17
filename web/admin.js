var ws = undefined;
var wsPort = 9955;
var reconnectAttemper = undefined;
var func = undefined;

//When the window loads
window.onload = function () {
    openSocket(function (connected) {
        if (connected) {
        }
        else {
        }
        console.log("Web socket state = " + connected);
    });

    //When the user sets a clock
    document.getElementById("setClock").onclick = function () {
        var fluro = document.getElementById("fluroURL");
        var elvanto = document.getElementById("elvantoURL");

        if (fluro.value != "" && elvanto.value != "") {
            alert("Please only set 1 clock. You cannot have both Fluro and Elvanto at the same time");
        }
        else if (fluro.value != "") {
            send(JSON.stringify({
                "password": document.getElementById("password").value,
                "function": "fluro",
                "command": "setURL",
                "value": document.getElementById("fluroURL").value
            }));
        }
        else if (elvanto.value != "") {
            clearClocks();
            send(JSON.stringify({
                "password": document.getElementById("password").value,
                "function": "elvanto",
                "command": "setURL",
                "value": document.getElementById("elvantoURL").value
            }));
        }
        else {
            alert("Please enter something into one of the Fluro or Elvanto URL felids");
        }
    }

    //When the user clears a clock
    document.getElementById("clearClock").onclick = function () {
        clearClocks();
    }
}

//Clear the clocks
function clearClocks() {
    console.log("Clear clocks");
    send(JSON.stringify({
        "password": document.getElementById("password").value,
        "function": "fluro",
        "command": "clearClock",
        "value": ""
    }));
    send(JSON.stringify({
        "password": document.getElementById("password").value,
        "function": "elvanto",
        "command": "clearClock",
        "value": ""
    }));
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
        console.log(message);
        switch (message.event) {
            case "configuration": {
                if (message.value.type == "webConfiguration") {
                    if (message.value.functions["fluro"].enabled == true) {
                        document.getElementById("clocks").style.display = "block";
                        document.getElementById("fluroClock").style.display = "block";
                        document.getElementById("fluroClock").style.float = "";
                    }
                    if (message.value.functions["elvanto"].enabled == true) {
                        document.getElementById("clocks").style.display = "block";
                        document.getElementById("elvantoClock").style.display = "block";
                        document.getElementById("elvantoClock").style.float = "";
                    }
                    if (message.value.functions["fluro"].enabled == true && message.value.functions["elvanto"].enabled == true) {
                        document.getElementById("fluroClock").style.float = "left";
                        document.getElementById("elvantoClock").style.float = "right";   
                    }
                    document.getElementById("advancedButtons").innerHTML = "";
                    for (var i in message.value.functions) {
                        if (message.value.functions[i].hasConfigurableItems == true) {
                            var button = document.createElement("button");
                            button.onclick = function (event) {
                                window.location.href = './changeSettings.html?function=' + event.target.getAttribute("function");
                            };
                            button.setAttribute("function", i);
                            button.innerHTML = i[0].toUpperCase() + i.toLowerCase().slice(1) + " Settings";
                            document.getElementById("advancedButtons").appendChild(button);
                        }
                    }
                }
                else if (message.value.type == "configurationSuccess") {
                    alert("Saved successful! Restarting...");
                    setTimeout(function () {
                        window.location.reload();
                    }, 5000);
                }
                break;
            }
            case "error": {
                addConsoleInformation(message.value.function, message.value.type, message.value.error, "red");
                if (message.value.type == "authenticationError") {
                    alert("Sorry that password was incorrect");
                }
                break;
            }
            case "information": {
                addConsoleInformation(message.value.function, message.value.type, message.value.value, "black");
                break;
            }
        }
    }
}

//Add information to the information console
function addConsoleInformation(a, b, text, color = "black") {
    var temp = "[" + a + "][" + b + "] - " + text;
    document.getElementById("consoleInformation").innerHTML += "<p style='color:" + color + "'>" + temp + "</p>";
    document.getElementById("consoleInformation").scrollTop = document.getElementById("consoleInformation").scrollHeight;
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