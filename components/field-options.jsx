var React = require("react/addons");

var cx = React.addons.classSet;

var Options = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        form: React.PropTypes.object.isRequired,
        label: React.PropTypes.string.isRequired,
        validator: React.PropTypes.func,
        transform: React.PropTypes.func
    },

    onChange: function() {},

    render: function() {
        var self = this;
        var valid = null;
        var value = "";
        var namespaced = "field-" + this.props.name;

        if ( typeof this.props.form.fields[ this.props.name ] !== "undefined" ) {
            value = this.props.form.fields[ this.props.name ].value;
            valid = this.props.form.fields[ this.props.name ].valid;
        }

        var classes = cx({
            "form-group": true,
            "has-error": valid === false
        });

        var options = [];

        for ( var i in self.props.values ) {
            var option = self.props.values[i];

            options.push(
                <div className="radio" key={ i }>
                    <input
                        id={ namespaced + "-" + option }
                        name={ self.props.name }
                        type="radio"
                        value={ option }
                        data-label={ i }
                        checked={ option == value }

                        onChange={ self.onChange } />

                    <label htmlFor={ namespaced + "-" + option }>
                        { self.props.prefix ? self.props.prefix + i : i }
                    </label>
                </div>
            )
        }

        return (
            <div className={ classes }>
                <label className="control-label" htmlFor={ namespaced }>{ this.props.label }{ this.props.requried && <span className="required">*</span> }</label>

                { options }
            </div>
        )
    }
});

module.exports = Options;
