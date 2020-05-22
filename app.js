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
const http = require('http');
const fs = require("fs")
const url = require('url'); 
module.exports = class ChurchClocks extends EventEmitter{
    constructor(enableWebSocket = false, webSocketPassword = "", webSocketPort = 9955, enableWebServer = false, webServerPort = 80) {
        super();
        var object = this;

        this.enableWebSocket = enableWebSocket;
        this.enableWebServer = enableWebServer;
        if(this.enableWebSocket) {
            object.emit("information", object.generateInformationEvent("application", "websocket", "Websocket enabled"));
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

        //If webserver is enabled set it up
        if(this.enableWebServer == true) {
            object.emit("information", object.generateInformationEvent("application", "webserver", "Webserver enabled"));
            http.createServer(function (request, response) {
                var path = url.parse(request.url).pathname; 

                if(path == "/"){path = "index.html";}

                fs.readFile("./web/" + path, function(error, data) {  
                    if (error) {  
                        response.writeHead(404);  
                        response.write("404: Not found");  
                        response.end();  
                    }
                    else {
                        if(path.includes(".css")){response.writeHead(200, { "Content-Type": "text/css"});}
                        else if(path.includes(".js")){response.writeHead(200, { "Content-Type": "text/javascript"});}
                        else{response.writeHead(200, { "Content-Type": "text/html"});}
                        response.write(data);  
                        response.end();
                    }
                });
            }).listen(webServerPort);
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