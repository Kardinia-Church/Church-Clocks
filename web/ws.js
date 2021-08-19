/**
 * Church Clocks
 * Handle the WS with the server
 */

 var ws = undefined;
 var wsPort = 9955;
 var reconnectAttemper = undefined;

 //Read the storage
 function readStorage() {
     try{document.getElementById("password").value = sessionStorage.getItem("password");}
     catch(e){}
 }

 //Set the storage
 function setStorage() {
     sessionStorage.setItem("password", document.getElementById("password").value);
 }

 function showPopup(header, desc, color="red") {
     var alert = document.getElementById("alert");
     alert.getElementsByTagName("h1")[0].innerHTML = header;
     alert.getElementsByTagName("p")[0].innerHTML = desc;
     alert.style.backgroundColor = "white";
     alert.style.borderColor = color;
     alert.style.display = "block";
     setTimeout(function(){alert.style.display = "none";}, 1500);
 }

 //Open the websocket
function openSocket(connectionCallback, messageCallback) {
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
    var msgCallback = messageCallback;
    ws.onmessage = function (message) {
        if(messageCallback !== undefined) {
            messageCallback(JSON.parse(message.data));
        }
    }
}

//Send a message
function send(message) {
    if (ws.readyState != ws.OPEN) {
        console.log("Websocket is not open it is in " + ws.readyState);
        showPopup("Error", "Couldn't do that as we're disconnected from the server..");
        location.reload();
    }
    else {
        ws.send(message);
    }
}