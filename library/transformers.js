//
// Mostly taken from Stripe's Payment.js
// https://github.com/stripe/jquery.payment/blob/master/lib/jquery.payment.js
//

var card = require("./card");
var processor = require("./processors")[ global.rsd.options.processor ];

var injector = function( value, indexes, early ) {
    for ( var i in indexes ) {
        if ( early ) {
            if ( value.length >= indexes[i].l ) {
                value = value.slice( 0, indexes[i].l ) + indexes[i].c + value.slice( indexes[i].l, value.length );
            }
        } else {
            if ( value.length > indexes[i].l ) {
                value = value.slice( 0, indexes[i].l ) + indexes[i].c + value.slice( indexes[i].l, value.length );
            }
        }
    }

    return value;
};


exports.amount = function( oldValue, newValue, field, form ) {
    var updated;

    if ( field === processor.fields.amountToggle ) {
        updated = processor.fields.amountOther;
        form.fields[ processor.fields.amountOther ].value = "";
        form.fields[ processor.fields.amountOther ].valid = true;
    } else {
        updated = processor.fields.amountToggle;

        if ( global.rsd.options.processor === "convio"
            && typeof global.rsd.options.convioOther !== "undefined" ) {
            // Convio requires a value in the level_id parameter if an other value is choosen
            // so we'll set it here to keep Convio happy. Nonsensical error is passed to end user
            // if they use the other field if this isn't set.
            form.fields[ processor.fields.amountToggle ].value = global.rsd.options.convioOther;
            form.fields[ processor.fields.amountToggle ].valid = true;
        } else {
            form.fields[ processor.fields.amountToggle ].value = 0;
            form.fields[ processor.fields.amountToggle ].valid = true;
        }
    }

    form.amount = form.fields[ processor.fields.amountToggle ] || form.fields[ processor.fields.amountOther ];

    return { form: form, updated: updated };
};


exports.card = function( oldValue, newValue ) {
    var next = newValue.slice(-1);

    oldValue = oldValue.replace(/\D/g, "");
    newValue = newValue.replace(/\D/g, "");

    var brand = card.brand( newValue );

    function formatCard( number ) {
        if ( brand && brand.type === 'amex' ) {
            return injector( number, [ { l: 4, c: " " },  { l: 11, c: " " } ]);
        } else {
            return injector( number, [ { l: 4, c: " " },  { l: 9, c: " " }, { l: 14, c: " " } ]);
        }
    }

    if ( brand && ( newValue.length > brand.length[ brand.length.length - 1 ] ) ) {
        return formatCard( oldValue );
    } else {
        if ( newValue < oldValue ) {
            return formatCard( newValue );
        } else {
            if ( !/^\d+$/.test( next ) || newValue.length > 16 ) {
                return formatCard( oldValue );
            } else {
                return formatCard( newValue );
            }
        }
    }
};


exports.expires = function( oldValue, newValue ) {
    var next = newValue.slice(-1);

    oldValue = oldValue.replace(/\D/g, "");
    newValue = newValue.replace(/\D/g, "");

    function formatExpires( number ) {
        if ( oldValue === newValue ) {
            return number
        } else {
            return injector( number, [ { l: 2, c: " / " } ], true );
        }        
    }

    if ( newValue.length > 6 ) {
        return formatExpires( oldValue );
    } else {
        return formatExpires( newValue );
    }
};
