//When the window loads
window.onload = function () {
    readStorage();
    var params = new URLSearchParams(window.location.search);
    func = params.get("function");
    openSocket((connected) => {
        console.log("Web socket state = " + connected);
        send(JSON.stringify({
            "password": undefined,
            "function": func,
            "command": "getConfigurableItems",
            "value": ""
        }));
    }, (message) => {
        switch (message.event) {
            case "response": {
                if (message.value == false) {
                    showPopup("Error", "Sorry something happened while handling that request, please try again");
                }
                else if (typeof (message.value) == "string") {
                    showPopup("Error", message.value);
                }
                else {
                    switch (message.command) {
                        case "getConfigurableItems": {
                            if (message.function == func) {
                                populateSettingFields(message);
                                document.getElementById("error").style.display = "none";
                                document.getElementById("generatedConfig").style.display = "block";
                            }
                            break;
                        }
                    }
                }
                break;
            }
        }
    });
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
    submit.onclick = function () {
        var values = {};
        var inputs = settings.getElementsByTagName("input");
        for (var i in inputs) {
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
    for (var i in incoming.value) {
        var label = document.createElement("label");
        var element = document.createElement("input");
        var desc = document.createElement("p");
        element.name = i;
        label.htmlFor = i;
        desc.innerHTML = incoming.value[i].description;
        label.innerHTML = incoming.value[i].title;
        element.type = incoming.value[i].type;
        element.value = incoming.value[i].value;

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