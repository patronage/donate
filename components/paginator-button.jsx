var React = require("react/addons");

var PaginatorButton = React.createClass({
    propTypes: {
        steps: React.PropTypes.array,
        amount: React.PropTypes.number,
        current: React.PropTypes.number,
        switchStep: React.PropTypes.func,
        parentState: React.PropTypes.object
    },

    handleClick: function( event ) {
        event.preventDefault();

        // React tends to pass things as strings sometimes.
        this.props.switchStep( parseInt( this.props.current ) + 1 );
    },

    render: function() {
        if ( this.props.steps.length ) {
            var step = this.props.steps[ this.props.current - 1 ];
            var context = false;

            if ( typeof step.context !== "undefined" ) {
                context = step.context;
            }

            if ( context ) {
                if ( context === "submit" ) {
                    var text;

                    if ( this.props.parentState.status === "submitting" ) {
                        text = "Submitting...";
                    } else {
                        text = "Donate $" + this.props.amount.toFixed(2);
                    }

                    return (
                        <div>
                            <button
                                type="submit"
                                disabled={ this.props.parentState.status === "submitting" }
                                className="btn btn-lg btn-primary btn-block">
                                { text }
                            </button>
                        </div>
                    );
                } else if ( context === "thanks" ) {
                    return (
                        <div></div>
                    );
                }
            } else {
                return (
                    <div>
                        <button
                            type="button"
                            className="btn btn-lg btn-primary btn-block"
                            onClick={ this.handleClick }>
                            Next &raquo;
                        </button>
                    </div>
                );
            }
        } else {
            return (
                <div></div>
            )
        }
    }
});

module.exports = PaginatorButton;
