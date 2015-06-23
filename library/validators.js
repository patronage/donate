var card = require("./card");
var validator = require("validator");
var processor = require("./processors")[ global.rsd.options.processor ];


// IndexOf polyfill
__indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };


module.exports = {

    // A few basic validation rules wrapped around validator.js - todo: automate
    // these a bit better so we can easily add validator.js ones.
    rules: {
        amount: function( value, field, form ) {
            var toggle, other, errorShown;

            if ( field === processor.fields.amountToggle ) {
                toggle = value;
                other = form.fields[ processor.fields.amountOther ].value;
            } else if ( field === processor.fields.amountOther ) {
                toggle = form.fields[ processor.fields.amountToggle ].value;
                other = value;
            }

            if ( global.rsd.options.processor === "convio" &&
                typeof global.rsd.options.convioOther !== "undefined" ) {
                // Convio sets the value of toggle to something not empty
                // so we need to check against that to validate

                if ( ( toggle !== "" && toggle !== global.rsd.options.convioOther ) || other > 0 ) {
                    return { valid: true };
                } else {
                    return { valid: false };
                }
            } else {
                if ( ( toggle !== "" && toggle !== 0 ) || ( other > 0 && !isNaN( other ) )) {
                    return { valid: true };
                } else {
                    return { valid: false };
                }
            }
        },

        email: function( value ) {
            if ( validator.isEmail( value ) ) {
                return { valid: true, error: "" };
            } else {
                return {
                    valid: false,
                    error: "Email is invalid"
                };
            }
        },


        card: function( value ) {
            value = value.replace(/\D/g, "");

            if ( validator.isCreditCard( value ) ) {
                return { valid: true, error: "" };
            } else {
                return {
                    valid: false,
                    error: "%field% is invalid"
                };
            }
        },

        expires: function( value ) {
            var expiration = card.expiration( value );

            var month = expiration.month;
            var year = expiration.year;

            var expiry = new Date( year, month );
            var currentTime = new Date();
            expiry.setMonth( expiry.getMonth() - 1 );
            expiry.setMonth( expiry.getMonth() + 1, 1 );

            if ( expiry > currentTime ) {
                return { valid: true, error: "" };
            } else {
                return {
                    valid: false,
                    error: "%field% must be in the future"
                };
            }
        },

        postal: function( value ) {
            if ( validator.isLength( value, 5 ) ) {
                return { valid: true, error: "" };
            } else {
                return {
                    valid: false,
                    error: "%field% must contain 5 digits"
                };
            }
        }
    },

    // Validate a field within the form.
    // Returns valid state (true/false) and error string, if applicable
    field: function field( name, value, form, refs ) {
        if ( typeof refs[ name ] !== "undefined" ) {
            var error = "";
            var valid = true;

            // Get all the things we defined for the field in the main form here
            var props = refs[ name ].props;

            if ( props.validator ) {
                var validator = props.validator( value, name, form );

                valid = validator.valid;
                error = validator.error;
            }

            // Required field enforcement
            if ( props.required && value === "" ) {
                valid = false;
                error = props.label + " is required";
            }

            if ( error ) {
                // Put user-defined label into error message
                error = error.replace("%field%", props.label);
            }

            return {
                valid: valid,
                error: error
            };
        } else {
            return false;
        }
    },


    // Validate an individual step or all of the steps at once by checking the
    // valid state of each one previously set by the field validator.
    step: function step( step, state ) {
        var steps = state.steps;

        // Check each step for validity
        for ( var i = 0; i < steps.length; i++ ) {
            var anyNull = false;
            var validity = true;
            var fields = {};

            // Get fields for this step
            for ( var j in state.form.fields ) {
                if ( state.form.fields[j].step === ( i + 1 ) ) {
                    fields[j] = state.form.fields[j];
                }
            }

            // Check each fields validity for this step
            for ( var k in fields ) {
                var field = fields[k];

                if ( field.valid === null ) {
                    anyNull = true;
                }

                if ( field.valid !== true ) {
                    validity = false;
                }
            }

            steps[i].valid = ( anyNull ? null : validity );
        }

        // Return the result for a single step or return the results for all
        // steps to set the forms step state
        if ( typeof step === "number" ) {
            return steps[step] || false;
        } else {
            return steps;
        }
    },

    // Validate the entire form - this is the same thing as the step validator,
    // without the step part. It also returns a simple true / false. It's used
    // just to check if we're good to submit to the server.
    form: function form( form ) {
        var anyNull = false;
        var validity = true;

        for ( var i in form.fields ) {
            var field = form.fields[i];

            if ( field.valid === null ) {
                anyNull = true;
            }

            if ( field.valid !== true ) {
                validity = false;
            }
        }

        return ( anyNull ? null : validity );
    },

    // This will run the individual field validators on a whim (whenever you'd like),
    // not tied to an onChange/onBlur event. Good for turning fields red on button clicks.
    // This will return an updated Form object that should be set in state whereever this
    // function is called from.
    run: function run( currentStep, state, refs ) {
        for ( var i in refs ) {
            var ref = refs[i];

            var name = ref.props.name;
            var step = state.form.fields[ name ].step;
            var value = state.form.fields[ name ].value;

            // Check for name and that step matches
            // Or, if we pass false for the current step, run this on the entire form
            if ( name && ( ( typeof currentStep === "number" && currentStep === step ) ||
                ( typeof currentStep === "boolean" && !currentStep ) ) ) {

                // Run the field validator that is setup above
                var validator = this.field( name, value, state.form, refs );

                if ( validator ) {
                    // Save everything back to the form object
                    state.form.fields[name].valid = validator.valid;
                    state.form.fields[name].error = validator.error;

                    // Simulate all edit states so the fields can be edited as if
                    // errors were all triggerd naturally
                    state.form.fields[name].changed = true;
                    state.form.fields[name].blurred = true;
                }
            }
        }

        // Re-run step validation too
        state.steps = this.step( false, state );

        return { form: state.form, steps: state.steps };
    }
};
