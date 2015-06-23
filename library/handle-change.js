// This library processes the change for each field, running a few tasks to check
// the validity of the field, running transformers on the field, if applicable,
// and checking the validity of the form as a whole.
//
// React chokes when you run multiple onChanges that depend on each other so an
// onChange handler needs to handle more than just the immediate action of the change

var processor = require("./processors")[ global.rsd.options.processor ];
var validator = require("./validators.js");

module.exports = function( event, state, refs ) {
    //
    // Populate and validate the formally edited field
    //
    var tags = "";
    var valid = true;
    var name = event.target.name;
    var value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    var label = event.target.getAttribute("data-label");


    // We can't do anything with name-less fields
    if ( name ) {
        // Get the validator, the transformer, etc
        var props = refs[ name ].props;

        // Run the attached validator for each field
        if ( props.transform ) {
            var transform = props.transform( state.form.fields[ name ].value, value, name, state.form );

            if ( typeof transform === "object" ) {
                // Advanced transforms only

                if ( transform.field ) {
                    value = transform.field;
                }

                if ( transform.form ) {
                    state.form = transform.form;
                }

                if ( transform.updated ) {
                    state.form.updated = transform.updated;
                }
            } else {
                value = transform;
            }
        }

        // Attach "tags" which will be rendered as classes on the field element
        // itself. Think CC icons, flag icons, whatever you'd wish to show.
        if ( props.tags ) {
            tags = props.tags( value );
        }

        // Run the validators for this field and get the valid state and error message,
        // if applicable
        var results = validator.field( name, value, state.form, refs );

        // Save everything back to the form object
        state.form.fields[name].value = value;

        // Only turn field red if user has exited it before - this keeps inital
        // typing less eratic for email/credit card fields. But we disable this for
        // radio buttons, checkboxes, and select elements since they don't blur
        if ( state.form.fields[name].blurred ||
            event.target.type === "radio" ||
            event.target.type === "select-one" || // oh, react...
            event.target.type === "checkbox" ) {
            state.form.fields[name].valid = results.valid;
        }

        // Disable error message if field is validated but don't show the error
        // message again until the user blurs the field
        if ( results.valid ) {
            state.form.fields[name].error = "";
        }

        state.form.fields[name].tags = tags;
        state.form.fields[name].changed = true;
        state.form.focus = event.target.name;

        // Get the validation status for each step and update it for the entire
        // form so that our paginator can know how to show states, etc.
        var steps = validator.step( false, state );

        var data = {
            form: state.form,
            steps: steps
        };

        // Set the amount if this is an amount being updated
        if ( name === processor.fields.amount ||
            name === processor.fields.amountOther ||
            name === processor.fields.amountToggle ) {

            // Set the amount to the label in convio. Ugh.
            if ( name === processor.fields.amountToggle ) {
                data.amount = parseFloat( label );
            } else {
                data.amount = parseFloat( value );
            }
        }

        return data;
    } else {
        return false;
    }
};
