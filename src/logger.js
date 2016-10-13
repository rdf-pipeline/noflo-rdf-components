// logger.js

var _ = require('underscore');

var levels = [
    'debug',
    'dir',
    'log',
    'info',
    'warn',
    'error',
    'assert'
];

/**
 * Creates a custom logger for this package
 */
var buffer = [];
module.exports = {
    time: console.time.bind(console),
    timeEnd: console.timeEnd.bind(console),
    silence: function(limit) {
        levels.forEach(function(level) {
            if (!limit || limit == 'all' || levels.indexOf(level) <= levels.indexOf(limit))
                this[level] = _.noop;
        }, this);
    },
    verbose: function(limit) {
        levels.forEach(function(level) {
            if (levels.indexOf(level) >= levels.indexOf(limit))
                this[level] = logging(console, level);
        }, this);
    },
    buffer: function() {
        levels.forEach(function(level) {
            this[level] = function(/* arguments */) {
                buffer.push([level, arguments]);
            };
        }, this);
    },
    flush: function() {
        buffer.forEach(function(item) {
            var level = item[0] == 'debug' ? 'log' : item[0];
            logging(console, level).apply(this, item[1]);
        });
        this.clear();
    },
    clear: function() {
        buffer = [];
    },
};

module.exports.verbose('all');
module.exports.silence('debug');

function logging(console, level) {
    var prop = level == 'debug' ? 'log' : level;
    return function (/* arguments */) {
        return console[prop].apply(console, arguments);
    };
}
