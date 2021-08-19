var setPlanId = undefined;

//When the window loads
window.onload = function () {
    //Check for password
    readStorage();

    openSocket((connected) => {
        console.log("Web socket state = " + connected);
    }, (message) => {
        switch (message.event) {
            case "response": {
                if(message.value == false) {
                    showPopup("Something Happened", "Sorry something happened while handling that request, please try again");
                }
                else if(typeof(message.value) == "string") {
                    showPopup("Error", message.value);
                }
                else {
                    switch(message.command) {
                        case "login": {
                            if(message.value.correct == true) {
                                setStorage();
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
                                document.getElementById("login").style.display = "none";
                                document.getElementById("main").style.display = "block";
                            }
                            else {
                                showPopup("Error", "Password incorrect");
                            }
                            break;
                        }
                    }
                }
                break;
            }
            case "information": {
                addConsoleInformation(message.value.function, message.value.type, message.value.value, "black");
                break;
            }
            case "error": {
                addConsoleInformation(message.value.function, message.value.type, message.value.error, "red");
                break;
            }
        }
    });

    //When the user sets a clock
    document.getElementById("setClock").onclick = function () {
        var fluro = document.getElementById("fluroURL");
        var elvanto = document.getElementById("elvantoURL");

        if (fluro.value != "" && elvanto.value != "") {
            showPopup("Error", "Please only set 1 clock. You cannot have both Fluro and Elvanto at the same time");
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
            showPopup("Error", "Please enter something into one of the Fluro or Elvanto URL felids");
        }
    }

    //When the user clears a clock
    document.getElementById("clearClock").onclick = function () {
        clearClocks();
    }
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
            "function": "application",
            "command": "login",
            "value": ""
        }));
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

//Add information to the information console
function addConsoleInformation(a, b, text, color = "black") {
    var temp = "[" + a + "][" + b + "] - " + text;
    document.getElementById("consoleInformation").innerHTML += "<p style='color:" + color + "'>" + temp + "</p>";
    document.getElementById("consoleInformation").scrollTop = document.getElementById("consoleInformation").scrollHeight;
}

//Restart the server
function restart() {
    send(JSON.stringify({
        "password": document.getElementById("password").value,
        "function": "application",
        "command": "restart",
        "value": ""
    }));
}