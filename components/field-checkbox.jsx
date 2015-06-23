var React = require("react/addons");

var cx = React.addons.classSet;

var Checkbox = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        form: React.PropTypes.object.isRequired,
        label: React.PropTypes.string.isRequired,
        validator: React.PropTypes.func,
        transform: React.PropTypes.func
    },

    render: function() {
        // Mostly sets classes for Bootstrap regarding the current valid state.
        var tags = "form-control ";
        var valid = null;
        var value = "";
        var namespaced = "field-" + this.props.name;

        if ( typeof this.props.form.fields[ this.props.name ] !== "undefined" ) {
            value = this.props.form.fields[ this.props.name ].value;
            valid = this.props.form.fields[ this.props.name ].valid;
            tags += this.props.form.fields[ this.props.name ].tags;
        }

        var classes = cx({
            "checkbox": true,
            "has-error": valid === false
        });

        return (
            <div className={ classes }>
                <label className="control-label">
                    <input
                        id={ namespaced }
                        type="checkbox"
                        name={ this.props.name }
                        value={ value }
                        data-label={ this.props.label }
                    />
                    { this.props.label }
                </label>

            </div>
        )
    }
});

module.exports = Checkbox;
