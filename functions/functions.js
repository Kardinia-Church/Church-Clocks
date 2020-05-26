const fs = require("fs")

module.exports = {
    list: {
        elvanto: require("./elvanto.js"),
        proPresenter: require("./proPresenter.js"),
        proVideoPlayer: require("./proVideoPlayer.js"),
        "systemtime": require("./systemtime.js")
    },
    
    getFunctions: function(filePath) {
        //Check the directory exists
        if (!fs.existsSync(filePath)){
            fs.mkdirSync(filePath);
        }

        var temp = [];
        for(var i in this.list) {
            var objTemp = new this.list[i];
            objTemp.setFilePath(filePath);
            temp.push(objTemp);
        }
        return temp;
    }
}