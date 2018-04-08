if (!Number.prototype.toFixedNumber) {
    /* jshint ignore:start */
    Number.prototype.toFixedNumber = function (x, base) {
        let pow = Math.pow(base || 10, x);
        return +(Math.round(this * pow) / pow);
    };
    /* jshint ignore:end */
}