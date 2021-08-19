var setPlanId = undefined;

//When the window loads
window.onload = function () {
    readStorage();
    openSocket((connected) => {
        console.log("Web socket state = " + connected);
    }, (message) => {
        switch (message.event) {
            case "response": {
                if(message.value == false) {
                    showPopup("Error", "Sorry something happened while handling that request, please try again");
                }
                else if(typeof(message.value) == "string") {
                    showPopup("Error", message.value);
                }
                else {
                    switch(message.command) {
                        case "setEvent": {
                            if(message.value == true) {
                                showPopup("Success!", "The event was set", "green");
                                if(setPlanId) {
                                    window.location.href = "https://live.fluro.io/plan/" + setPlanId;
                                }
                            }
                            break;
                        }
                        case "getEvents": {
                            setStorage();
                            document.getElementById("login").style.display = "none";
                            var events = document.getElementById("events");
                            events.innerHTML = "<h1>Please Select an Event</h1>";
    
                            for (var i in message.value) {
                                var element = document.createElement("div");
                                element.classList.add("serviceButton");
                                element.innerHTML += "<h2>" + message.value[i].title + "</h2>";
                                element.innerHTML += "<p>" + new Date(message.value[i].startDate).toDateString() + "</p>";
                                element.setAttribute("id", message.value[i]._id);
                                element.setAttribute("planId", message.value[i].plans[0]._id);
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
                            break;
                        }
                    }
                }
                break;
            }
        }
    });
}

//Attempt to login
function login() {
    if (ws.readyState != ws.OPEN) {
        showPopup("Error", "Cannot login as we're not connected to the server, please try refreshing the page or wait a minute");
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