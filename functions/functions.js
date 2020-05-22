module.exports = {
    list: {
        elvanto: require("./elvanto.js"),
        proPresenter: require("./proPresenter.js"),
        proVideoPlayer: require("./proVideoPlayer.js")
    },
    
    getFunctions: function() {
        var temp = [];
        for(var i in this.list) {
            temp.push(new this.list[i]);
        }
        return temp;
    }
}