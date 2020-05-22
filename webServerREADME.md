# Currently in development


# WebServer
This module also provides a web server that allows things like ProPresenter to use for it's stage display functionality

## How to use
This server if enabled can be accessed at ```<host>:<configured port>/index.html?type=<type>``` and will display a webpage based on the passed parameter ```type```

### Supported types
* elvanto_countdown_clock
This will display the elvanto coutdown clock (Current time left for current item)
* elvanto_items
This will display the current item followed by the next item
* elvanto_currentitem
This will display the current item name
* elvanto_nextitem
This will display the next item name