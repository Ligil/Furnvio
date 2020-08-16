const moment = require('moment');
module.exports = {
    formatDate: function(date, targetFormat){
        return moment(date).format(targetFormat)
    },

    radioCheck: function(value, radioValue){
        if (value == radioValue){
            return 'checked'
        } else {
            return ''
        }
    },

    replaceCommas: function(strText){
        if (strText == ''){
            return 'None'
        };

        return strText.split(",").join(" | ")
    },

    ifCond: function (v1, operator, v2, options) {

        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },

    ifIn: function(elem, list, options) {
        if (list == null || elem == null){ //if either null, fail, ask Trillium if you need to change
            return options.inverse(this);
        } else if(list.indexOf(elem) > -1) { //if in list, success
            return options.fn(this);
        } else{ //if not in list, fail
            return options.inverse(this);
        }
    },

    numberFormat: function(value, options){ 
        // http://jsfiddle.net/DennyLoko/6sR87/
        // Helper parameters
        var dl = options.hash['decimalLength'] || 2;
        var ts = options.hash['thousandsSep'] || ',';
        var ds = options.hash['decimalSep'] || '.';
    
        // Parse to float
        var value = parseFloat(value);
    
        // The regex
        var re = '\\d(?=(\\d{3})+' + (dl > 0 ? '\\D' : '$') + ')';
    
        // Formats the number with the decimals
        var num = value.toFixed(Math.max(0, ~~dl));
    
        // Returns the formatted number
        return (ds ? num.replace('.', ds) : num).replace(new RegExp(re, 'g'), '$&' + ts);
    },
    
    numberFormat2: function(value){ 
        return (value * 100);
    }
}