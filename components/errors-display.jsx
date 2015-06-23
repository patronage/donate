var React = require("react/addons");

var cx = React.addons.classSet;

var ErrorsDisplay = React.createClass({
    propTypes: {
        form: React.PropTypes.object.isRequired,
        step: React.PropTypes.number.isRequired
    },

    render: function() {
        if ( this.props.message ) {
            return (
                <div className="error-message text-center">
                    { this.props.message }
                </div>
            );
        } else {
            var errors = [];

            for ( var i in this.props.form.fields ) {
                var field = this.props.form.fields[i];

                if ( global.rsd.options.sequential ) {
                    if ( field.error && field.step === this.props.step ) {
                        errors.push( field.error );
                    }
                } else {
                    if ( field.error ) {
                        errors.push( field.error );
                    }
                }
            }

            return (
                <ul className="errors-list">
                    {errors.map(function( error, i ) {
                        return (
                            <li key={ i }>{ error }</li>
                        );
                    })}
                </ul>
            );
        }
    }
});

module.exports = ErrorsDisplay;
