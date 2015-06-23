// This library processes the change for each field, running a few tasks to check
// the validity of the field, running transformers on the field, if applicable,
// and checking the validity of the form as a whole.
//
// React chokes when you run multiple onChanges that depend on each other so an
// onChange handler needs to handle more than just the immediate action of the change

var validator = require("./validators.js");

module.exports = function( event, state, refs ) {
    //
    // Populate and validate the formally edited field
    //
    var error = "";
    var name = event.target.name;
    var value = event.target.value;
    var label = event.target.getAttribute("data-label");

    // We can't do anything with name-less fields
    if ( name ) {
        // Get the error messages for the form
        var results = validator.field( name, value, state.form, refs );

        // Only validate if the field was changed before
        if ( state.form.fields[ name ].changed ) {
            state.form.fields[name].valid = results.valid;
            state.form.fields[name].error = results.error;

            if ( results.error ) {
                // Error Encountered callback
                if ( typeof global.rsd.options.onFieldError === "function" ) {
                    if ( typeof global.rsd.errorsSent === "undefined" ) {
                        global.rsd.errorsSent = [];
                    }

                    if ( global.rsd.errorsSent.indexOf( results.error ) === -1 ) {
                        global.rsd.options.onFieldError( results.error );

                        global.rsd.errorsSent.push( results.error );
                    }
                }
            }

            // Entered Data callback
            if ( typeof global.rsd.options.onEnteredData === "function" ) {
                if ( typeof global.rsd.fieldsSent === "undefined" ) {
                    global.rsd.fieldsSent = [];
                }

                if ( global.rsd.fieldsSent.indexOf( label ) === -1 ) {
                    global.rsd.options.onEnteredData( label );

                    global.rsd.fieldsSent.push( label );
                }
            }
        }

        // Set blurred to true to quiet down onChange until field has been
        // invalided
        state.form.fields[name].blurred = true;

        // Re-run steps validation
        var steps = validator.step( false, state );

        // Save everything back to the form object
        return {
            form: state.form,
            steps: steps
        };
    } else {
        return false;
    }
};
