# Church Clocks
 A nodejs script which is designed to provide a websocket connection to gain information from ProPresenter, ProVideoPlayer, and Elvanto

# Installation
This module supports running a required script in your own code or can be run directly.
* First install nodejs and npm on your machine
* Type ```npm install -g church-clocks --unsafe_perm=true``` to install the module
When installing the installer should ask if you want to set the settings for each module

# Using as a standalone webserver
This module includes a standalone script which exposes a websocket and/or a webserver for accesing the clocks

## Running
In order to run as a standalone webserver you must install the module above and run the installer script to configure the configuration files which will be at ```<userdirectory>/.church-clocks```. This script will be ran when installing church-clocks or can be ran again by running ```generateSettings.js```
* Find the location where npm installed the module typically in ```/usr/local/lib/node``` or ```/usr/local/lib/node_modules``` for linux machines and ```%USERPROFILE%\AppData\Roaming\npm\node_modules``` for windows
* Navigate to the .church-clocks directory ```cd /usr/local/lib/node_modules/church-clocks```
* Run ```node run.js``` to run it or ```node install.js``` to generate the settings file

### Running on boot (Linux)
In order to run on boot you need to find the command that is required to run the module above. This will typically be in ```/usr/local/lib/node_modules/church-clocks```
* First install pm2 ```npm install pm2 -g```
* Type ```sudo pm2 start <YOUR_NPM_LOCATION>/church-clocks/pm2Service.json```
* Type ```sudo pm2 save``` to save the changes
* Check the logs with ```sudo pm2 logs```

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
* current_time
This will display the current system time
* elvanto_countdown_clock
This will display the elvanto coutdown clock (Current time left for current item)
* elvanto_items
This will display the current item followed by the next item
* elvanto_currentitem
This will display the current item name
* elvanto_nextitem
This will display the next item name
*pvp_video_clock
This will display the video countdown clock for ProVideoPlayer. `pvp-transportid``` must be set to the id of the transport you wish to get the time from
*pp_video_clock
This will display a video countdown clock for ProPresenter.
* pvpandpp_video_clock
This will display a clock depending on ProPresenter or ProVideoPlayers clock. If the main clock is not active the other clock if active will display the value. Setting parameter ```main-clock=pvp/pp``` will set what clock takes importance with the pvp clock being default. ```pvp_transportid``` must be set to the id of the transport you wish to get the time from
*pp_lyric_next
This will display the next lyric in ProPresenter
*pp_lyric_current
This will display the current lyric in ProPresenter


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

## Controlling functions
Functions can be sent requests by using the ```sendToFunctions(message)``` function and passing a message as follows:
```
{
    "function": "functionName",
    "command": "command",
    "value": "value
}
```

# Functions
This module provides basic funcitonality as follows:
## Elvanto
### Receiving from Elvanto
Elvanto when connected to a service will output its data as follows from the functionEvent event:
```
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

## Troubleshooting
### Elvanto saying it cannot open the browser
This is probably due to puppeteer. Try a few things below to see if it solves your issue
* Try setting the last parameter in the elvanto settings file to ```/usr/bin/chromium-browser``` for linux machines
* Try setting the last parameter in the elvanto settings file to the location of the chromium browser
* Try installing chromimum
