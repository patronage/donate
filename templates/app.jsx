var qs    = require('qs');
var React = require('react/addons');
var cx    = require('classnames');

var Checkbox        = require('../components/field-checkbox.jsx');
var ErrorsDisplay   = require('../components/errors-display.jsx');
var Field           = require('../components/field-text.jsx');
var Options         = require('../components/field-options.jsx');
var PaginatorButton = require('../components/paginator-button.jsx');
var PaginatorLinks  = require('../components/paginator-links.jsx');
var PaginatorSteps  = require('../components/paginator-steps.jsx');
var Select          = require('../components/field-select.jsx');
var Step            = require('../components/step.jsx');

var tags         = require('../library/tags.js');
var smoothScroll = require('../library/scroll.js');
var states       = require('../data/states.json');

// Load these modules later (after config is loaded into window);
var blur, change, processors, validator, transformers;
var queries = qs.parse( location.search.substr(1) );

var Sequential = React.createClass({

    propTypes: {
        options: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
        return {
            form: { focus: null, fields: {}, step: 1 },
            steps: [],
            error: '',
            status: 'render',
            amount: 0
        };
    },

    componentWillMount: function() {
        // Read all the config items into state
        var self = this;

        if ( this.props.options ) {
            // todo: rename our namespace
            global.rsd = { options: self.props.options || {} };
        }

        // Late load modules that depend on set globals
        processors = require('../library/processors.js');
        validator = require('../library/validators.js');
        transformers = require('../library/transformers.js');
        change = require('../library/handle-change.js');
        blur = require('../library/handle-blur.js');
    },

    componentDidMount: function() {
        // Now that the app is loaded, allow the user to interact with it.
        var state = this.state;
        state.status = "interactive";

        // If debug-thanks=true is set, go directly to our Thank You page
        if ( queries["debug-thanks"] === "true" ) {
            state.form.step = ( this.state.steps.length );
        }

        this.setState( state );

        // shouldComponentUpdate runs on a different timetable then us - a little
        // behind the flow of things, so forceUpdate to make the button render.
        this.forceUpdate();
    },

    shouldComponentUpdate: function() {
        // This prevents our app from redrawing 8 times while figuring out fields
        // and steps and theoritically speeds it up a tiny bit
        if ( this.state.status === "render" ) {
            return false;
        } else {
            return true;
        }
    },

    getDefaultProps: function() {
        // TODO: Defaults, option validation,

        // Sadly these don't actually merge in with our existing props like they would
        // with jQuery so there's no use to make this comprehensive (yet);
        return {
            options: {
                slug: "",
                debug: false,
                apikey: "",
                formid: "",
                amounts: { 10: 10, 25: 25, 50: 50, 100: 100 },
                processor: "stripe"
            }
        };
    },

    componentDidUpdate: function (prevProps, prevState) {
        if ( prevState.form.step === 1 && this.state.form.step === 2 ) {
            var target = document.getElementById('patronage-donate-form');
            smoothScroll(document.body, target.getBoundingClientRect().top, 300);
        }
    },

    switchStep: function( next ) {
        next = parseInt( next );
        var state = this.state;

        // Only switch step if the app is in interactive mode
        if ( this.state.status === "interactive" || this.state.status === "submitting" ) {
            // Check range validity
            if ( next <= this.state.steps.length ) {
                // Run the validator real quick, just in case data was autofilled
                var results = validator.run( this.state.form.step, this.state, this.refs );
                this.setState({ form: results.form });

                var switchable = true;

                // Check all prior steps for validity before switching
                for ( var i = 0; i < ( next - 1 ); i++ ) {
                    var step = this.state.steps[i];

                    if ( !step.valid ) {
                        switchable = false;
                    }
                }

                // Only switch if all prior steps are valid
                if ( switchable ) {
                    if ( typeof global.rsd.options.onSwitchStep === "function" ) {
                        global.rsd.options.onSwitchStep( next );
                    }

                    state.form.step = next;

                    this.setState( state );
                }
            }
        }
    },

    setParentState: function( newState ) {
        // This allows children to edit the parent state easily, which is primarily
        // used for automating some things with fields and steps
        this.setState( newState );
    },

    handleChange: function( event ) {
        if ( this.state.status === "interactive" ) {
            // Charge() is a function that works with <Field /> to handle all
            // field data given <Field />s attributes
            var parsed = change( event, this.state, this.refs );

            if ( parsed ) {
                var data = {
                    form: parsed.form,
                    steps: parsed.steps
                };

                if ( parsed.amount ) {
                    data.amount = parsed.amount;
                }

                this.setState( data );
            }

            if ( event.target.type === "radio" ) {
                // Chrome won't fire onBlur for radio buttons so we'll do that
                // ourselves because react
                this.handleBlur( event );
            }
        }
    },

    handleBlur: function( event ) {
        if ( this.state.status === "interactive" ) {
            // Blur() is a function that works with <Field /> to handle all
            // field data given <Field />s attributes
            var parsed = blur( event, this.state, this.refs );

            if ( parsed ) {
                this.setState({
                    form: parsed.form,
                    steps: parsed.steps
                });
            }
        }
    },

    handleSubmit: function( event ) {
        event.preventDefault();

        // Prevent double-submissions (which convio will allow...)
        if ( this.state.status === "interactive" ) {
            if ( validator.form( this.state.form ) ) {
                var self = this;
                var form = this.state.form;

                if ( typeof global.rsd.options.onSubmit === "function" ) {
                    global.rsd.options.onSubmit();
                }

                this.setState({ status: "submitting" });

                // this code will work for any processor, except stripe
                processors[ global.rsd.options.processor ].submit( form, function( error, data, message ) {
                    if ( error ) {
                        if ( message ) {
                            // If a message was passed, it's more imporant than any data we recieved
                            self.setState({ error: message, status: "interactive" });
                        } else {
                            // In this case, we're looking for a list of fields that were erratic
                            var first = 0;

                            // Errors pass back "error objects" in data which is an array of
                            // objects like { field: "", message: "" }
                            for ( var i in data ) {
                                var field = data[i];
                                var name = field.field;
                                var step = form.fields[ name ].step;

                                // Assign invalid state and error message to field
                                form.fields[ name ].valid = false;
                                form.fields[ name ].error = field.message;

                                if ( !first ) {
                                    first = step;
                                }
                            }

                            // Switch to the first errors step
                            if ( data.length > 0 ) {
                                self.setState({
                                    form: form,
                                    step: first,
                                    status: "interactive"
                                });
                            } else {
                                self.setState({
                                    form: form,
                                    status: "interactive",
                                    error: "An unexpected error has occurred"
                                });
                            }
                        }
                    } else {
                        // This blindly assumes our last step is the thank you - is it?
                        // Maybe maybe switchStep work with IDs too?
                        self.switchStep( self.state.steps.length );

                        self.setState({ status: "complete" });
                    }
                });
            } else {
                // Form is not all valid -- run the validator to flag fields
                var results = validator.run( false, this.state, this.refs );

                this.setState({ form: results.form, steps: results.steps });
            }
        }
    },

    getValue: function( field ) {
        if ( typeof this.state.form.fields[ this.props.name ] !== "undefined" ) {
            return this.state.form.fields[ this.props.name ].value;
        } else {
            return "";
        }
    },

    render: function() {
        var fields = processors[ global.rsd.options.processor ].fields;

        var classes = cx({
            "patronage-donate": true,
            "is-complete": this.state.status === "complete",
            "is-sequential": typeof global.rsd.options.sequential !== "undefined" ? global.rsd.options.sequential : true,
            "is-not-sequential": typeof global.rsd.options.sequential !== "undefined" ? !global.rsd.options.sequential :  false
        });

        return (
            <div className={ classes }>
                <div className="patronage-donate-header">
                    <PaginatorLinks current={ this.state.form.step } steps={ this.state.steps } switchStep={ this.switchStep } />
                </div>

                <form id="patronage-donate-form" onChange={ this.handleChange } onBlur={ this.handleBlur } onSubmit={ this.handleSubmit }>
                    <div className="patronage-donate-intro" dangerouslySetInnerHTML={{ __html: this.props.options.introContent }}></div>
                    <ErrorsDisplay form={ this.state.form } step={ this.state.form.step } message={ this.state.error } />

                    <PaginatorSteps
                        step={ this.state.form.step }
                        switchStep={ this.switchStep }
                        parentState={ this.state }
                        setParentState={ this.setParentState } >

                        <Step>
                            <h2>Gift Information</h2>

                            <div className="row">
                                <div className="col-sm-9">
                                    <Options ref={ fields.amountToggle } name={ fields.amountToggle } label="Amount" prefix="$" values={ global.rsd.options.amounts } form={ this.state.form } transform={ transformers.amount } validator={ validator.rules.amount } />
                                </div>

                                <div className="col-sm-3">
                                    <Field glyph="$" ref={ fields.amountOther } name={ fields.amountOther } label="Other amount" form={ this.state.form } transform={ transformers.amount } validator={ validator.rules.amount } />
                                </div>
                            </div>
                        </Step>

                        <Step>
                            <h2>Personal Information</h2>

                            <div className="row">
                                <div className="col-sm-6">
                                    <Field ref={ fields.firstName } name={ fields.firstName } label="First Name" form={ this.state.form } required />
                                </div>

                                <div className="col-sm-6">
                                    <Field ref={ fields.lastName } name={ fields.lastName } label="Last Name" form={ this.state.form } required />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-12">
                                    <Field ref={ fields.email } name={ fields.email } label="Email" validator={ validator.rules.email } form={ this.state.form } required />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-12">
                                    <Field ref={ fields.addressStreet1 } name={ fields.addressStreet1 } label="Street Address" form={ this.state.form } required />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-12">
                                    <Field ref={ fields.addressStreet2 } name={ fields.addressStreet2 } label="Street Address, line 2" form={ this.state.form } />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-5">
                                    <Field ref={ fields.addressCity } name={ fields.addressCity } label="City" form={ this.state.form } required />
                                </div>

                                <div className="col-sm-4">
                                    <Select ref={ fields.addressState } name={ fields.addressState } label="State" data={ states } form={ this.state.form } required />
                                </div>

                                <div className="col-sm-3">
                                    <Field ref={ fields.addressPostal } name={ fields.addressPostal } label="Zip Code" validator={ validator.rules.postal } form={ this.state.form } required />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-12">
                                    <Field ref={ fields.phone } name={ fields.phone } label="Phone Number" form={ this.state.form } />
                                </div>
                            </div>
                        </Step>

                        <Step context="submit">
                            <h2>Payment Information</h2>
                            <div className="row">
                                <div className="col-sm-12">
                                    <Field ref={ fields.cardNumber } name={ fields.cardNumber } label="Card Number" validator={ validator.rules.card } transform={ transformers.card } tags={ tags.card } form={ this.state.form } required />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-6">
                                    <Field ref={ fields.cardExpires } name={ fields.cardExpires } label="Expiration Date" placeholder="mm / yy" validator={ validator.rules.expires } transform={ transformers.expires } form={ this.state.form } required />
                                </div>

                                <div className="col-sm-6">
                                    <Field ref={ fields.cardCVC } name={ fields.cardCVC } label="CVC" form={ this.state.form } required />
                                </div>
                            </div>
                        </Step>

                        <Step context="thanks">
                            <div className="patronage-donate-thanks" dangerouslySetInnerHTML={{ __html: this.props.options.thanksContent }}></div>
                        </Step>
                    </PaginatorSteps>

                    <PaginatorButton
                        steps={ this.state.steps }
                        current={ this.state.form.step }
                        amount={ this.state.amount }
                        switchStep={ this.switchStep }
                        parentState={ this.state } />
                </form>
            </div>
        );
    }
});

module.exports = Sequential;

global.PatronageDonate = function( element, options ) {
    React.render(
        <Sequential options={ options } />,
        element
    );
};
