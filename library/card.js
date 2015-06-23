// Taken from jQuery.payment, removed all dom requirements

var defaultFormat = /(\d{1,4})/g;

var cards = [{
    type: 'visaelectron',
    pattern: /^4(026|17500|405|508|844|91[37])/,
    format: defaultFormat,
    length: [16],
    cvcLength: [3],
    luhn: true
}, {
    type: 'maestro',
    pattern: /^(5(018|0[23]|[68])|6(39|7))/,
    format: defaultFormat,
    length: [12, 13, 14, 15, 16, 17, 18, 19],
    cvcLength: [3],
    luhn: true
}, {
    type: 'forbrugsforeningen',
    pattern: /^600/,
    format: defaultFormat,
    length: [16],
    cvcLength: [3],
    luhn: true
}, {
    type: 'dankort',
    pattern: /^5019/,
    format: defaultFormat,
    length: [16],
    cvcLength: [3],
    luhn: true
}, {
    type: 'visa',
    pattern: /^4/,
    format: defaultFormat,
    length: [13, 16],
    cvcLength: [3],
    luhn: true
}, {
    type: 'mastercard',
    pattern: /^5[0-5]/,
    format: defaultFormat,
    length: [16],
    cvcLength: [3],
    luhn: true
}, {
    type: 'amex',
    pattern: /^3[47]/,
    format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
    length: [15],
    cvcLength: [3, 4],
    luhn: true
}, {
    type: 'dinersclub',
    pattern: /^3[0689]/,
    format: defaultFormat,
    length: [14],
    cvcLength: [3],
    luhn: true
}, {
    type: 'discover',
    pattern: /^6([045]|22)/,
    format: defaultFormat,
    length: [16],
    cvcLength: [3],
    luhn: true
}, {
    type: 'unionpay',
    pattern: /^(62|88)/,
    format: defaultFormat,
    length: [16, 17, 18, 19],
    cvcLength: [3],
    luhn: false
}, {
    type: 'jcb',
    pattern: /^35/,
    format: defaultFormat,
    length: [16],
    cvcLength: [3],
    luhn: true
}];


exports.brand = function( num ) {
    var card, _i, _len;

    num = (num + '').replace(/\D/g, '');

    for ( _i = 0, _len = cards.length; _i < _len; _i++ ) {
        card = cards[_i];

        if ( card.pattern.test(num) ) {
            return card;
        }
    }
};


exports.luhn = function( num ) {
    var odd = true;
    var sum = 0;
    var digits = (num + '').split('').reverse();

    for ( var _i = 0, _len = digits.length; _i < _len; _i++ ) {
        var digit = digits[_i];
        digit = parseInt(digit, 10);

        if ( ( odd = !odd ) ) {
            digit *= 2;
        }

        if ( digit > 9 ) {
            digit -= 9;
        }

        sum += digit;
    }

    return sum % 10 === 0;
};


exports.expiration = function( value ) {
    value = value.replace(/\D/g, '');

    var month = value.substring(0, 2);
    var year = value.substring(2);

    if (( year != null ? year.length : void 0 ) === 2 && /^\d+$/.test(year) ) {
        prefix = (new Date).getFullYear();
        prefix = prefix.toString().slice( 0, 2 );
        year = prefix + year;
    }

    month = parseInt(month, 10);
    year = parseInt(year, 10);

    if ( !( month && year ) ) {
        return false;
    }

    if ( !(( 1 <= month && month <= 12 )) ) {
        return false;
    }

    if ( year.length === 2 ) {
        if ( year < 70 ) {
            year = "20" + year;
        } else {
            year = "19" + year;
        }
    }

    if ( year.toString().length !== 4 ) {
        return false;
    }

    return { month: month, year: year }
};
