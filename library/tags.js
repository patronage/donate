// Tags are for adding classes to an input based on their value. Credit card icons
// for the CC field, flags for the country field if you want, provider icon for phone
// field, if that's your thing

var card = require("./card");

module.exports = {
    card: function( value ) {
        if ( typeof card.brand( value ) === "object" ) {
            return card.brand( value ).type;
        } else {
            return false;
        }
    }
};
