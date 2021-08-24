# Church Clocks
 A nodejs script which is designed to provide a websocket connection to gain information from ProPresenter, ProVideoPlayer, Elvanto, and Fluro

# Installation
This module supports running a required script in your own code or can be run directly.
* First install nodejs and npm on your machine
* Type ```npm install -g church-clocks --unsafe_perm=true``` to install the module
When installing the installer should ask if you want to set the settings for each module

# Using as a standalone webserver
This module includes a standalone script which exposes a websocket and/or a webserver for accessing the clocks

## Running
In order to run as a standalone webserver you must install the module above and run the installer script to configure the configuration files which will be at ```<userdirectory>/.church-clocks```. This script will be ran when installing church-clocks or can be ran again by running ```generateSettings.js```
* Find the location where npm installed the module typically in ```/usr/local/lib/node``` or ```/usr/local/lib/node_modules``` for linux machines and ```%USERPROFILE%\AppData\Roaming\npm\node_modules``` for windows
* Navigate to the .church-clocks directory ```cd /usr/local/lib/node_modules/church-clocks```
* Run ```node run.js``` to run it or ```node install.js``` to generate the settings file

### Running on boot (Linux)
In order to run on boot you need to find the command that is required to run the module above. This will typically be in ```/usr/local/lib/node_modules/church-clocks```
* First install pm2 ```npm install pm2 -g```
* Type ```pm2 start /usr/local/lib/node_modules/church-clocks/pm2Service.json```
* Type ```pm2 save``` to save the changes
* Type ```pm2 startup``` to make it launch on boot
* Check the logs with ```pm2 logs church-clocks```

## WebSocket
## Connecting
The WebSocket can be at ```<YOUR_IP>:9955``` and when connected should output all supported events which can be seen below in the API reference.

## Command format
In general the command format can be seen in the API reference, however the WebSocket is formatted differently.
### Receiving from server
The following is the format that is expected to come from the WebSocket to your script
```
{
    "event": "The event that is being outputted",
    "value": "The value of that event
}
```
So as an example a supported function would come in as follows:
```
{
    "event": "functionEvent",
    "value": {
        "function": "functionName",
        "command": "command",
        "value": "value"
    }
}
```
### Sending to server
The following is the format that is expected to be sent to the WebSocket from your script
```
{
    "password": "if the password is required by the function",
    "function": "function name",
    "command": "the command to be processed,
    "value": "the value of tht command
}
```
So as an example setting the Elvanto service would be as follows:
```
{
    "password": "password if set in the general settings file",
    "function": "elvanto",
    "command": "setService",
    "value": "The elvanto live url for the wanted service"
}
```
This commands can be found below in function commands

## WebServer
This module also provides a web server that allows things like ProPresenter to use for it's stage display functionality

### How to use
This server if enabled can be accessed at ```<host>:<configured port>/index.html?type=<type>``` and will display a webpage based on the passed parameter ```type```
By default the configured port is 80

### Supported Parameters
* ```type``` The type of clock to be displayed
* ```backgroundcolor``` The background color to be set if required (Note use * instead of # so #0C056D would be *0C056D)
* ```color``` The text color to be set if required (Note use * instead of # so #0C056D would be *0C056D)
* ```scale``` The scale of the page. Setting the scale parameter sets the font-size of all text
* ```font``` The font to display

For example ```http://localhost/?type=elvanto_countdown_clock&backgroundcolor=*4C146D&scale=20em&font=arial```

#### Supported types
* ```current_time```
This will display the current system time
* ```elvanto_countdown_clock```
This will display the elvanto countdown clock (Current time left for current item)
* ```fluro_countdown_clock```
This will display the fluro countdown clock (Current time left for current item)
* ```elvanto_items```
This will display the current item followed by the next item
* ```elvanto_currentitem```
This will display the current item name
* ```elvanto_nextitem```
This will display the next item name
*```pvp_video_clock```
This will display the video countdown clock for ProVideoPlayer. `pvp-transportid``` must be set to the id of the transport you wish to get the time from
*```pp_video_clock```
This will display a video countdown clock for ProPresenter.
* ```pvpandpp_video_clock```
This will display a clock depending on ProPresenter or ProVideoPlayers clock. If the main clock is not active the other clock if active will display the value. Setting parameter ```main_clock=pvp/pp``` will set what clock takes importance with the pvp clock being default. ```pvp_transportid``` must be set to the id of the transport you wish to get the time from
* ```pp_lyric_next```
This will display the next lyric in ProPresenter
* ```pp_lyric_current```
This will display the current lyric in ProPresenter
* ```debug```
Will show all the incoming data. Useful if you're developing your own solution


# Using as an included module
* Include the module using ```const churchClocks = require("church-clocks");```.
* Then create the object using ```new churchClocks(webSocketEnabled, webSocketPassword, webSocketPort, webServerEnabled, webServerPort, filePath)```
Where ```webSocketEnabled will enable/disable the websocket```, ```websocketPassword``` will set the password that is required to pass in the WebSocket password to perform commands, ```webSocketPort``` will change the port used to access the websocket, ```webServerEnabled``` will enable/disable the inbuilt webserver, ```filePath``` is where the settings files are stored default is ```%USERPROFILE%/.church-clocks/``` for windows and ```~/.church-clocks/``` for linux.

## Events
Events can be accessed by using ```object.on(<eventName>, function(){})```
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
```
{
    "function": "the function name",
    "type": "the type of command being sent",
    "value": "the value" 
}
```

# Configuration
The configuration files can be edited using the admin control panel found at ```admin.html``` the password is by default an empty string (just hit login without entering anything)

The configuration files can be found at the location listed when running ```node run.js``` this should be in your user directory (for Windows ```C:/users/<user>/.church-clocks``` for Linux ```/home/<user>/.church-clocks```)

## Application Settings
In the ```.church-clocks``` directory there will be a file called ```applicationSettings.txt``` this is the settings for the application.

* ```webSocketEnabled``` Should the websocket be enabled? Default true
* ```webSocketPassword``` What should the password be for the websocket? This is also used in admin configuration pages. Default ""
* ```webSocketPort``` Should the websocket be enabled? Default 9955. **This will be forced to port 9955 if the web server is enabled!**
* ```webServerEnabled``` Should the web server be enabled? Default true
* ```webServerPort``` What port should the web server be on? Default 80

## Function Settings

In the ```.church-clocks\functionSettings``` directory there will be several files for each function below.

### Fluro settings
The Fluro module is setup to dynamically grab the next service depending on the settings provided.
* **enabled** Should the function be enabled?
* **apiKey:** An API Key from Fluro
* **realm:** The ID of a realm the event(s) are stored in
* **track:** The ID of an event track that the event(s) are stored in
* **date:** Specify a date to get events for (useful for testing) // Should be in `YYYY-MM-DD` format
* **eventID:** Specify a specific event ID (the first plan will be fetched)*
* **planID:** Grab a specific plan
* **roomIDs:** Used by the setFluroClock.html page to search for events. Can be separated by a ```,```.
* **timezone** Change the timezone used. Default Melbourne/Australia
* **serviceChangeRedirectURL** What URL should the setFluroClock.html page send the user to on successful plan update. ```<planId>``` will populate the plan id, ```<eventId>``` will populate the eventId that was chosen.

### Elvanto settings
* **enabled** Should the function be enabled?
* **username** Your Elvanto bot username
* **password** Your Elvnato bot password
* **puppeteerExecutablePath** Change the puppeteerExecutablePath if required

### ProPresenter settings
* **enabled** Should the function be enabled?
* **host** The host ip address
* **port** The host port
* **password** The password found in the settings

### ProVideoPlayer settings
* **enabled** Should the function be enabled?
* **host** The host ip address
* **api** The api location. Default /api/0/
* **authToken** The auth token found in settings

# Function Commands
Below are commands that are supported to send to functions
```
{
    "password": "if the password is required by the function",
    "function": "function name",
    "command": "the command to be processed,
    "value": "the value of tht command
}
```
Commands may also respond using the following sent directly to the current web socket connection
```
{
    "event": "response",
    "value": {
        "function": "functionName",
        "command": "command",
        "value": "value"
    }
}
//Note if there is an error this will return false or a description of the error in the value
```

## Elvanto
### setService
Will update the service
```
{
    "password": "is required",
    "function": "elvanto"
    "command": "setService"
    "value": "?id=joijio6-hiuht-uhi6-hiuhiu65-hiuhiu5&time_id=wifuwehfiweiufh-hi7-hi65-iuhiuhiuhiu65"
}
```
### clearService
Will clear the current clock
```
{
    "password": "is required",
    "function": "elvanto"
    "command": "clearService"
    "value": ""
}
```

## Fluro
### getEvents
Will get a list of events within the set configuration and a range of 3 days from the current date
```
//Request
{
    "password": "is required",
    "function": "fluro"
    "command": "getEvents"
    "value": ""
}
//Response
{
    "event": "response",
    "value": {
        "function": "fluro",
        "command": "getEvents",
        "value": {
            "events": An array of events,
            "serviceChangeRedirectURL": The url set in the configuration file
        }
    }
}
```
### clearClock
Will clear the current clock. Note if you have set an event/plan etc in the settings it will return back to that
```
//Request
{
    "password": "is required",
    "function": "fluro"
    "command": "clearClock"
    "value": ""
}
//Response
{
    "event": "response",
    "value": {
        "function": "fluro",
        "command": "clearClock",
        "value": true
    }
}
```
### setEvent
Will set an event
```
//Request
{
    "password": "is required",
    "function": "fluro"
    "command": "setEvent"
    "value": "<eventId>"
}
//Response
{
    "event": "response",
    "value": {
        "function": "fluro",
        "command": "setEvent",
        "value": true
    }
}
```
### setURL
Will set an event
```
//Request
{
    "password": "is required",
    "function": "fluro"
    "command": "setURL"
    "value": "A fluro live URL (This is expected to use live.fluro.io)"
}
//Response
{
    "event": "response",
    "value": {
        "function": "fluro",
        "command": "setURL",
        "value": true
    }
}
```

## Troubleshooting
### Elvanto saying it cannot open the browser
This is probably due to puppeteer. Try a few things below to see if it solves your issue
* Try setting the last parameter in the elvanto settings file to ```/usr/bin/chromium-browser``` for linux machines
* Try setting the last parameter in the elvanto settings file to the location of the chromium browser
* Try installing chromimum
