'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function SCTS(date, tzOff)
{
    /**
     * unix time
     * @var integer
     */
    this._time = date.getTime() / 1000;

    /**
     * time zone offset, in minutes
     * @var integer
     */
    if (tzOff === undefined)
        this._tzOff = -1 * date.getTimezoneOffset();
    else
        this._tzOff = tzOff;
}

/**
 * parse pdu string
 * @return SCTS
 */
SCTS.parse = function()
{
    var hex    = PDU.getPduSubstr(14),
        params = [];

    if( ! hex){
        throw new Error("Not enough bytes");
    }

    hex.match(/.{1,2}/g).map(function(s){
        /* NB: 7'th element (index = 6) is TimeZone and it can be a HEX */
        if((params.length < 6 && /\D+/.test(s)) ||
           (params.length == 6 && /[^0-9A-Fa-f]/.test(s))){
            return params.push(0);
        }

        params.push(
            parseInt(
                s.split("").reverse().join(""),
                params.length < 6 ? 10 : 16
            )
        );
    });

    /* Build ISO8601 datetime string in the YYYY-MM-DDTHH:mm:ss format */
    var isoStr = sprintf('%d-%02d-%02dT%02d:%02d:%02d',
                         params[0] > 70 ? 1900 + params[0] : 2000 + params[0],
                         params[1], params[2], params[3], params[4], params[5]);
    
    var date = new Date(isoStr);
    
    return new SCTS(date);
};

/**
 * getter time
 * @return integer
 */
SCTS.prototype.getTime = function()
{
    return this._time;
};

/**
 * getter tzOff
 * @return integer
 */
SCTS.prototype.getTzOff = function()
{
    return this._tzOff;
};

/**
 * format datatime for split
 * @return string
 */
SCTS.prototype._getDateTime = function()
{
    /**
     * Since the JS can not output time in the specified TimeZone we first
     * manually shift the UTC timestamp onto tzOffset and then use
     * getUTC{Year,Month,etc.}() methods to get a Year, Month, etc.
     */
    var tz = this.getTzOff();
    var dt = new Date((this.getTime() + tz * 60) * 1000);

    tz = Math.floor(tz / 15);   /* To quarters of an hour */
    return sprintf(
        '%02d%02d%02d%02d%02d%02d%02X',
        dt.getUTCFullYear() % 100,
        dt.getUTCMonth() + 1,
        dt.getUTCDate(),
        dt.getUTCHours(),
        dt.getUTCMinutes(),
        dt.getUTCSeconds(),
        Math.floor(Math.abs(tz / 10)) * 16 + tz % 10 +
        (tz < 0 ? 0x80 : 0x00)
    );
};

/**
 * cast to string
 * @return string
 */
SCTS.prototype.toString = function() 
{
    
    return this._getDateTime()
        .match(/.{1,2}/g)
        .map(function(s){
            return s.split("").reverse().join("")
        }).join("");
};


module.exports = SCTS;