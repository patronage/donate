var React = require("react/addons");

var cx = React.addons.classSet;

var PaginatorLinks = React.createClass({
    propTypes: {
        steps: React.PropTypes.array,
        switchStep: React.PropTypes.func,
        current: React.PropTypes.number
    },

    switchStep: function( event ) {
        event.preventDefault();

        this.props.switchStep( event.target.getAttribute("data-step") );
    },

    render: function() {
        var self = this;
        var links = [];

        for ( var i = 0; i < this.props.steps.length; i++ ) {
            var step = this.props.steps[i];

            var classes = cx({
                "is-active": i === ( this.props.current - 1 ),
                "is-complete": i < ( this.props.current - 1 ),
                "is-disabled": step.valid === false || step.valid === null || step.context === "thanks"
            });

            links.push(
                <li className={ classes } key={ i }>
                    <span className="paginator-number" onClick={ self.switchStep } data-step={ i + 1 }>{ i + 1 }</span>
                </li>
            );
        }

        return (
            <ul className="paginator">
                { links }
            </ul>
        );
    }

});

module.exports = PaginatorLinks;
