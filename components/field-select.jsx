var React = require("react/addons");

var cx = React.addons.classSet;

var Select = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        form: React.PropTypes.object.isRequired,
        label: React.PropTypes.string.isRequired,
        validator: React.PropTypes.func,
        transform: React.PropTypes.func
    },

    onChange: function() {},

    render: function() {
        var tags = "form-control ";
        var valid = null;
        var value = "";
        var disabled = false;
        var namespaced = "field-" + this.props.name;

        if ( typeof this.props.form.fields[ this.props.name ] !== "undefined" ) {
            // While the value of the "Select a X" is actually null, we set all fields
            // to "" to default, which is what we're checking for here.
            if ( this.props.form.fields[ this.props.name ].value !== "" ) {
                tags += this.props.form.fields[ this.props.name ].tags;
                value = this.props.form.fields[ this.props.name ].value;
                valid = true;
            } else {
                // Select elements are tricky. We only want the "Select a X" value to
                // invalidate the field if the field was previously valid, which is
                // what we're checking for here.
                if ( this.props.form.fields[ this.props.name ].valid !== null &&
                    typeof this.props.required !== "undefined" ) {
                    valid = false;
                }
            }

            disabled = ( this.props.form.step !== this.props.form.fields[ this.props.name ].step );
        } else if ( this.props.defaultValue ) {
            // If we pass a defaultValue, the field is true to start. TODO: this
            // doesn't invalidate the field if the empty option is choosen.
            value = this.props.defaultValue;
            valid = true;
        }

        var classes = cx({
            "form-group": true,
            "has-error": valid === false
        });

        return (
            <div className={ classes }>
                <label className="control-label" htmlFor={ namespaced }>{ this.props.label }{ this.props.required && <span className="required">*</span> }</label>
                <select
                    id={ namespaced }
                    name={ this.props.name }
                    value={ value }
                    tabIndex="1"
                    disabled={ disabled }
                    className={ tags }
                    onChange={ this.onChange }
                    data-label={ this.props.label }>

                    <option value="" key="-1">Select an option</option>

                    {this.props.data.map(function( value, i ) {
                        if ( value.data !== "" ) {
                            return (
                                <option value={ value.data } key={ i }>{ value.label }</option>
                            );
                        } else {
                            return (
                                <option key={ i } disabled>- - -</option>
                            );
                        }
                    })}
                </select>
            </div>
        );
    }
});

module.exports = Select;
