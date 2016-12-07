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
    }
};

module.exports.verbose('all');
module.exports.silence('debug');

function logging(console, level) {
    var prop = level == 'debug' ? 'log' : level;
    return function (/* arguments */) {
        return console[prop].apply(console, arguments);
    };
}
