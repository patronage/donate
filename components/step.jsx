var React = require("react/addons");

var cx = React.addons.classSet;

var Step = React.createClass({
    propTypes: {
        number: React.PropTypes.number,
        active: React.PropTypes.bool,
        switchStep: React.PropTypes.func,
        parentState: React.PropTypes.object,
        setParentState: React.PropTypes.func
    },

    nextStep: function( event ) {
        event.preventDefault();

        this.props.switchStep( parseInt( this.props.number ) + 1 );
    },

    setView: function( children ) {
        var self = this;
        var form = self.props.parentState.form;

        if ( form.fields ) {
            for ( var i in children ) {
                var child = children[i];
                var name = child.name;

                if ( typeof form.fields[ name ] === "undefined" ) {
                    var valid = null;

                    // Set fields without required or validator to valid
                    if ( typeof child.required === "undefined" && typeof child.validator === "undefined" ) {
                        valid = true;
                    }

                    form.fields[ name ] = {
                        tags: "",
                        error: "", // Error String
                        value: "", // Value of field
                        valid: valid, // Valid state ( t/f/null )
                        step: self.props.number, // Step field is in
                        changed: false, // Field changed?
                        blurred: false // Field blurred?
                    };

                    // If there's a default value of true, apply it
                    // (useful for things like opt-in subscriptions)
                    if ( child.checked ) {
                        form.fields[ name ].value = true
                    }
                }
            }

            self.props.setParentState({
                form: form
            });
        }
    },

    componentDidMount: function() {
        var fields = [];

        // Loop over all children so we can tell the app which child belongs
        // to which page so we can more seamlessly handle per-page validation
        var allChildren = (function allChildren( children ) {
            React.Children.forEach( children, function( child ) {
                if ( typeof child.type === "function" ) {
                    if ( child.type.displayName === "Field" ||
                        child.type.displayName === "Options" ||
                        child.type.displayName === "Select" ||
                        child.type.displayName === "Checkbox" ) {

                        fields.push( child.props );
                    }
                }

                if ( child.props ) {
                    if ( typeof child.props.children === "object" ) {
                        allChildren( child.props.children );
                    }
                }
            });
        })( this.props.children );

        this.setView( fields );
    },

    render: function() {
        var className = cx({
            "step": true,
            "step--active": this.props.active,
            "step--inactive": !this.props.active,
            "step--thanks": this.props.context === "thanks"
        });

        return (
            <div className={ className } onBlur={ this.handleBlur }>
                { this.props.children }
            </div>
        );
    }
});

module.exports = Step;
