# Church Clocks
 A nodejs script which is designed to provide a websocket connection to gain information from ProPresenter, ProVideoPlayer, and Elvanto

# How to setup
* First install nodejs and npm on your machine
* Type ```npm install -g church-clocks --unsafe_perm=true``` to install the module

## Running in your own script
* Include the module using ```const churchClocks = require("church-clocks");```. See an example below to get it working!

## Running standalone as a webserver
* 


# Using as a standalone webserver
This module includes a standalone script which exposes a websocket and/or a webserver for accesing the clocks

## WebSocket
## Connecting
The websocket if enabled can be accessed at ```<YOUR_IP>:9955``` and when connected should output all supported events which can be seen below in the API reference.

## Command format
In general the command format can be seen in the API reference, however the WebSocket is formatted differently.
```
{
    "event": "The event that is being outputted",
    "value": "The value of that event
}
```
So as an example a supported function would come in as follows:
{
    "event": "functionEvent",
    "value": 
    {
    }
}
```




# Using in a custom script
## Controlling Functions
Supported functions can be sent messages to control them. The typical format is as follows:
```
{
    "function": "functionName",
    "command": "command",
    "value": "value
}
```

### Controlling Elvanto
Elvanto can be controlled by sending
```
{
    "function": "elvanto",
    "command": "setService",
    "value": "?id=joijio6-hiuht-uhi6-hiuhiu65-hiuhiu5&time_id=wifuwehfiweiufh-hi7-hi65-iuhiuhiuhiu65"
}
```
Commands are as follows
* ```setService``` when passed a valid url though the ```value``` parameter from after the /live/ it will navigate and attempt to get service information
* ```clearService``` will logout of the service and close

### Events
In general all functions will output information as events which can be seen below
* ```connectionStatus``` is the emitter for updating on connection state changes
```
{
    function: "the function name",
    state: "status"
}
```

* ```error``` is the emitter for errors
```
{
    function: "the function name",
    errorType: "critical/warning",
    error: "The error"
}
```

* ```functionEvent``` events from the functions. This is usually where status comes from
```
{
    "function": "the function name",
    "type": "the type of command being sent",
    "value": "the value"
}
```
* ```information``` information events
{
    "function": "the function name",
    "type": "the type of command being sent",
    "value": "the value" 
}


## WebSocket
If enabled the script will open a websocket on port 9955 by default and will send out commands in the following format
```
{
    "event": "The event that is being outputted",
    "value": "The value of that event
}
```
The websocket will also process commands sent to it with the following format
```
{
    "password": "if the password is required by the function",
    "function": "function name",
    "command": "the command to be processed,
    "value": "the value of tht command
}

### Elvanto example
Elvanto by default supports setting the service and clearing the service with the following
```
{
    "password": "password if set in the general settings file",
    "function": "elvanto",
    "command": "setService / clearService",
    "value": "The elvanto service id after the /live/ in the url"
}
Note please use ```JSON.stringify(message)``` to send messages and ```JSON.parse(messages)``` to parse the recieved messages


## Troubleshooting
### Elvanto saying it cannot open the browser
This is probably due to puppeteer. Try a few things below to see if it solves your issue
* Try setting the last parameter in the elvanto settings file to ```/usr/bin/chromium-browser``` for linux machines
* Try setting the last parameter in the elvanto settings file to the location of the chromium browser
* Try installing chromimum

## Todo
* Add commands to control scripts
* Add web server to provide basic access to elements (for ProPresenter stage display)
