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

const {EventEmitter} = require("events");
const WebSocket = require('ws');
module.exports = class ChurchClocks extends EventEmitter{
    constructor(enableWebSocket = false, webSocketPassword = "", webSocketPort = 9955) {
        super();
        var object = this;

        this.enableWebSocket = enableWebSocket;
        if(this.enableWebSocket) {
            this.connections = [];
            this.wsPassword = webSocketPassword;
            this.wss = new WebSocket.Server({ port: webSocketPort });

            object.on("connectionStatus", function(message) {
                if(object.wss.clients.size !== 0) {
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
            object.on("functionEvent", function(message) {
                if(object.wss.clients.size !== 0) {
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
            object.on("information", function(message) {
                if(object.wss.clients.size !== 0) {
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
            object.on("error", function(message) {
                if(object.wss.clients.size !== 0) {
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
             
            //When we get a connection
            this.wss.on("connection", function connection(ws) {
                object.emit("information", object.generateInformationEvent("application", "websocket", "Client " + object.wss.clients.size + " connected"));


                //If we get a message from this client handle it
                ws.on("message", function(message) {
                    //If there is a password set then make sure it's correct
                    try {
                        var passCorrect = true;
                        var msg = JSON.parse(message)

                        if(object.wsPassword !== "") {
                            if(object.wsPassword !== msg.password) {passCorrect = false;}
                        }

                        if(passCorrect == true) {
                            //Send the message to the function
                            object.sendToFunctions({
                                "function": msg.function,
                                "command": msg.command,
                                "value": msg.value
                            });
                        }
                        else {
                            object.emit("error", object.generateErrorState("application", "authentication", "Password incorrect!"));
                        }
                    }
                    catch(e) {object.emit("error", object.generateErrorState("application", "internal", e.toString()));}
                });
            });
        }
        this.functions = require("./functions/functions.js").getFunctions();

        //Setup functions
        for(var i in this.functions) {
            this.functions[i].setup(this);
        }
    }

    //Generate the connection state emitter
    generateConnectionState(func, state){
        return {
            "function": func,
            "state": state
        }
    }

    //Generate the error state emitter
    generateErrorState(func, type, error){
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

    //Send a message to the internal fumctions to process something
    sendToFunctions(message) {
        var funcFound = false;
        for(var i in this.functions) {
            if(this.functions[i].handleIncoming(message) !== false) {funcFound = true; break;}
        }

        if(funcFound == false){
            this.emit("error", this.generateErrorState("application", "functionRequest", "Failed to find requested function"));
        }
    }
    
    //Attempt connection to all the modules
    connect() {
        var success = true;
        this.emit("connectionStatus", this.generateConnectionState("application", "Attempting Connection"));

        //Connect functions
        for(var i in this.functions) {
            this.functions[i].connect();
        }
    }
}