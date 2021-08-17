var ws = undefined;
var wsPort = 9955;
var reconnectAttemper = undefined;
var func = undefined;

//When the window loads
window.onload = function () {
    var params = new URLSearchParams(window.location.search);
    openSocket(function (connected) {
        if(connected) {
            document.getElementById("error").style.display = "none";
            document.getElementById("generatedConfig").style.display = "block";
        }
        else {
            document.getElementById("error").getElementsByTagName("h1")[0].innerHTML = "Connecting to the server, please wait";
            document.getElementById("error").getElementsByTagName("p")[0].innerHTML = "If this takes a while there might be a problem... Check the console for more information";
            document.getElementById("error").style.display = "block";
            document.getElementById("generatedConfig").style.display = "none";
        }
        console.log("Web socket state = " + connected);
    });

    func = params.get("function");
    if(func != undefined) {
        document.getElementById("error").getElementsByTagName("h1")[0].innerHTML = "Connecting to the server, please wait";
        document.getElementById("error").getElementsByTagName("p")[0].innerHTML = "If this takes a while there might be a problem... Check the console for more information";
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
        send(JSON.stringify({
            "password": undefined,
            "function": func,
            "command": "getConfigurableItems",
            "value": ""
        }));
    }

    //On WS message
    ws.onmessage = function (message) {
        message = JSON.parse(message.data);
        if(message.event == "configuration") {
            if(message.value.type == "getConfigurableItems") {
                populateSettingFields(message);
            }
            else if(message.value.type == "configurationSuccess") {
                alert("Saved successful! Restarting...");
                setTimeout(function() {
                    window.location.reload();
                }, 5000);
            }
        }
        else if(message.event == "error" && message.value.function == func) {
            if(message.value.type == "authenticationError") {
                alert("Sorry that password was incorrect");
            }
            console.log(message);
        }
    }
}

//Populate the HTML setting fields
function populateSettingFields(incoming) {
    var settings = document.getElementById("generatedConfig");
    settings.innerHTML = "";
    var passLabel = document.createElement("label");
    passLabel.htmlFor = "password";
    passLabel.innerHTML = "Password";
    var password = document.createElement("input");
    password.name = "password";
    password.type = "password";
    var submit = document.createElement("button");
    submit.innerHTML = "Save Settings";
    submit.onclick = function() {
        var values = {};
        var inputs = settings.getElementsByTagName("input");
        for(var i in inputs) {
            values[inputs[i].name] = inputs[i].value;
        }

        send(JSON.stringify({
            "password": password.value,
            "function": func,
            "command": "setConfigurableItems",
            "value": values
        }));
    }

    //Add the setting fields
    for(var i in incoming.value.value) {
        var label = document.createElement("label"); 
        var element = document.createElement("input");
        var desc = document.createElement("p");
        element.name = i;
        label.htmlFor = i;
        desc.innerHTML = incoming.value.value[i].description;
        label.innerHTML = incoming.value.value[i].title;
        element.type = incoming.value.value[i].type;
        element.value = incoming.value.value[i].value;

        settings.appendChild(label);
        settings.appendChild(desc);
        settings.appendChild(element);
        settings.appendChild(document.createElement("br"));
    }

    settings.appendChild(passLabel);
    settings.appendChild(document.createElement("br"));
    settings.appendChild(password);
    settings.appendChild(document.createElement("br"));
    settings.appendChild(submit);
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