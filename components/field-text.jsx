var React = require("react/addons");

var cx = React.addons.classSet;

var Field = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        type: React.PropTypes.string,
        form: React.PropTypes.object.isRequired,
        label: React.PropTypes.string.isRequired,
        pattern: React.PropTypes.string,
        validator: React.PropTypes.func,
        transform: React.PropTypes.func
    },

    // Suppress Reactmessages regarding controlled components
    onChange: function() {},

    render: function() {
        // Mostly sets classes for Bootstrap regarding the current valid state.
        var tags = "form-control ";
        var valid = null;
        var value = "";
        var disabled = false;
        var namespaced = "field-" + this.props.name;

        if ( typeof this.props.form.fields[ this.props.name ] !== "undefined" ) {
            value = this.props.form.fields[ this.props.name ].value;
            valid = this.props.form.fields[ this.props.name ].valid;
            tags += this.props.form.fields[ this.props.name ].tags;
            disabled = ( this.props.form.step !== this.props.form.fields[ this.props.name ].step );
        }


        var classes = cx({
            "form-group": true,
            "has-error": valid === false
        });

        if ( typeof this.props.type !== "undefined" && this.props.type === "textarea" ) {
            return (
                <div className={ classes }>
                    <label className="control-label" htmlFor={ namespaced }>{ this.props.label }{ this.props.required && <span className="required">*</span> }</label>
                    <textarea
                        id={ namespaced }
                        name={ this.props.name }
                        type={ this.props.type || "text" }
                        value={ value }
                        pattern={ this.props.pattern }
                        onChange={ this.onChange }
                        disabled={ disabled }
                        tabIndex="1"
                        className={ tags }
                        data-label={ this.props.label }
                        placeholder={ this.props.placeholder }></textarea>
                </div>
            );
        } else {
            return (
                <div className={ classes }>
                    <label className="control-label" htmlFor={ namespaced }>{ this.props.label }{ this.props.required && <span className="required">*</span> }</label>
                    <input
                        id={ namespaced }
                        name={ this.props.name }
                        type={ this.props.type || "text" }
                        value={ value }
                        pattern={ this.props.pattern }
                        onChange={ this.onChange }
                        disabled={ disabled }
                        tabIndex="1"
                        className={ tags }
                        data-label={ this.props.label }
                        placeholder={ this.props.placeholder } />
                </div>
            );
        }
    }
});

module.exports = Field;
