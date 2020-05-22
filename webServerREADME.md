# Currently in development


# WebServer
This module also provides a web server that allows things like ProPresenter to use for it's stage display functionality

## How to use
This server if enabled can be accessed at ```<host>:<configured port>/index.html?type=<type>``` and will display a webpage based on the passed parameter ```type```
By default the configured port is 80

### Supported Parameters
* ```type``` The type of clock to be displayed
* ```backgroundcolor``` The background color to be set if required (Note use * instead of # so #0C056D would be *0C056D)
* ```scale``` The scale of the page. Setting the scale parameter sets the font-size of all text
* ```font``` The font to display

For example ```http://localhost/?type=elvanto_countdown_clock&backgroundcolor=*4C146D&scale=20em&font=arial```

#### Supported types
* elvanto_countdown_clock
This will display the elvanto coutdown clock (Current time left for current item)
* elvanto_items
This will display the current item followed by the next item
* elvanto_currentitem
This will display the current item name
* elvanto_nextitem
This will display the next item name