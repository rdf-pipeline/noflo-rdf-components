// format.js

var BYTES_TO_MB = 1024 * 1024;

module.exports = {
    bytesToMb: function(num) {
        return (num/BYTES_TO_MB).toFixed(2) + 'MB';
    }
};
