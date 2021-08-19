/*
Church Clocks by Kardinia Church 2020
This project aims to provide a npm interface to get information from church specific applications like ProPresenter, ProVideoPlayer, and Elvanto

app.js: Main entry point
*/

/* Constructor
    - enableWebSocket: Should the websocket be enabled?
    - webSocketPassword: Websocket password
    - webSocketPort: The port of the websocket
*/

const { EventEmitter } = require("events");
const WebSocket = require('ws');
const http = require('http');
const fs = require("fs");
const url = require('url');
const os = require('os');
module.exports = class ChurchClocks extends EventEmitter {
    constructor(enableWebSocket = false, webSocketPassword = "", webSocketPort = 9955, enableWebServer = false, webServerPort = 80, filePath = os.homedir() + "/.church-clocks/") {
        super();
        var object = this;
        this.filePath = filePath;

        this.enableWebSocket = enableWebSocket;
        this.enableWebServer = enableWebServer;
        this.webServerPort = webServerPort;
        this.webSocketPort = webSocketPort;
        if (this.enableWebSocket) {
            object.emit("information", object.generateInformationEvent("application", "websocket", "Websocket enabled"));
            this.connections = [];
            this.wsPassword = webSocketPassword;
            this.wss = new WebSocket.Server({ port: webSocketPort });

            object.on("connectionStatus", function (message) {
                if (object.wss.clients.size !== 0) {
                    object.wss.clients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                "event": "connectionStatus",
                                "value": message
                            }));
                        }
                    });
                }
            });
            object.on("functionEvent", function (message) {
                if (object.wss.clients.size !== 0) {
                    object.wss.clients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                "event": "functionEvent",
                                "value": message
                            }));
                        }
                    });
                }
            });
            object.on("information", function (message) {
                if (object.wss.clients.size !== 0) {
                    object.wss.clients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                "event": "information",
                                "value": message
                            }));
                        }
                    });
                }
            });
            object.on("error", function (message) {
                if (object.wss.clients.size !== 0) {
                    object.wss.clients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                "event": "error",
                                "value": message
                            }));
                        }
                    });
                }
            });

            object.on("control", function (message) {
                if (object.wss.clients.size !== 0) {
                    object.wss.clients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                "event": "control",
                                "value": message
                            }));
                        }
                    });
                }

                //Handle control messages
                if(message.type == "exit") {
                    object.emit("information", object.generateInformationEvent("application", "Exit", "Exiting process - " + message.reason));
                    process.exit();
                }
            });

            //When we get a connection
            this.wss.on("connection", function connection(ws) {
                object.emit("information", object.generateInformationEvent("application", "websocket", "Client " + object.wss.clients.size + " connected"));
                //Send generic information
                var fns = {};
                for(var i in object.functions) {
                    fns[object.functions[i].function] = {
                        "enabled": object.functions[i].enabled,
                        "hasIncomingHandler": object.functions[i].incomingHandler !== undefined,
                        "hasConfigurableItems": object.functions[i].hasConfigurableItems == true
                    }
                }

                //If we get a message from this client handle it
                ws.on("message", function (message) {
                    //If there is a password set then make sure it's correct
                    try {
                        var msg = JSON.parse(message);
                        var passCorrect = object.wsPassword == msg.password || object.wsPassword == "";

                        //If its a applications specific call handle it
                        if(msg.function == "application") {
                            switch(msg.command) {
                                case "login": {
                                    ws.send(JSON.stringify({
                                        "event": "response",
                                        "function": msg.function,
                                        "command": msg.command,
                                        "value": {
                                            correct: passCorrect,
                                            functions: fns
                                        }
                                    }));
                                    return;
                                }
                            }
                        }

                        //Send the message to the function
                        var response = object.sendToFunctions({
                            "passwordCorrect": passCorrect,
                            "function": msg.function,
                            "command": msg.command,
                            "value": msg.value
                        }, (result) => {
                            ws.send(JSON.stringify({
                                "event": "response",
                                "function": msg.function,
                                "command": msg.command,
                                "value": result
                            }));
                        });
                    }
                    catch (e) { object.emit("error", object.generateErrorState("application", "internal", e.toString())); }
                });
            });
        }

        //If webserver is enabled set it up
        if (this.enableWebServer == true) {
            object.emit("information", object.generateInformationEvent("application", "webserver", "Webserver enabled"));
            http.createServer(function (request, response) {
                var path = url.parse(request.url).pathname;

                if (path == "/") { path = "index.html"; }

                fs.readFile("./web/" + path, function (error, data) {
                    if (error) {
                        response.writeHead(404);
                        response.write("404: Not found");
                        response.end();
                    }
                    else {
                        if (path.includes(".css")) { response.writeHead(200, { "Content-Type": "text/css" }); }
                        else if (path.includes(".js")) { response.writeHead(200, { "Content-Type": "text/javascript" }); }
                        else { response.writeHead(200, { "Content-Type": "text/html" }); }
                        response.write(data);
                        response.end();
                    }
                });
            }).listen(webServerPort);
        }

        this.functions = require("./functions/functions.js").getFunctions(this.filePath + "functionSettings/");

        //Setup functions
        for (var i in this.functions) {
            this.functions[i].setup(this);
        }
    }

    //Generate the connection state emitter
    generateConnectionState(func, state) {
        return {
            "function": func,
            "state": state
        }
    }

    //Generate the error state emitter
    generateErrorState(func, type, error) {
        return {
            "function": func,
            "type": type,
            "error": error
        }
    }

    //Generate a function event
    generateInformationEvent(func, type, value) {
        return {
            "function": func,
            "type": type,
            "value": value
        }
    }

    //Generate a control event
    generateControlEvent(type, reason) {
        return {
            type: type,
            reason: reason
        }
    }

    //Send a message to the internal functions to process something
    sendToFunctions(message, callback) {
        var funcFound = false;
        if(message.function == "application") {
            switch(message.command) {
                case "restart": {
                    if(message.passwordCorrect == true) {
                        this.emit("control", this.generateControlEvent("exit", "Restarting process on settings change"));
                    }
                    else {
                        this.emit("error", this.generateErrorState("application", "authenticationError", "Incorrect password"));
                    }
                    break;
                }
            }
        }
        else {
            for (var i in this.functions) {
                if(this.functions[i].function == message.function) {
                    try {
                        var result = this.functions[i].handleIncoming(message, callback);
                        if (result !== false) { funcFound = true; break; }
                    }
                    catch (e) { }
                }
            }
    
            if (funcFound == false) {
                this.emit("error", this.generateErrorState("application", "functionRequest", "Failed to find requested function"));
            }
        }
    }

    //Attempt connection to all the modules
    connect() {
        var success = true;
        this.emit("connectionStatus", this.generateConnectionState("application", "Attempting Connection"));
        this.emit("information", this.generateInformationEvent("application", "configuration", "Web Socket Enabled: " + this.enableWebSocket));
        this.emit("information", this.generateInformationEvent("application", "configuration", "Web Server Port: " + this.webServerPort));
        this.emit("information", this.generateInformationEvent("application", "configuration", "Web Server Enabled: " + this.enableWebServer));
        this.emit("information", this.generateInformationEvent("application", "configuration", "Web Socket Port: " + this.webSocketPort));

        //Connect functions
        for (var i in this.functions) {
            this.functions[i].connect();
        }
    }
}