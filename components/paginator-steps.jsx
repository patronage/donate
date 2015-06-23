var React = require("react/addons");

//
// This wraps the steps, counts how many steps there are, labels each step
// so it knows what its index is without us explicitly telling it, and provides
// the app with an idea of how many paginator links to create.
//

var PaginatorSteps = React.createClass({
    propTypes: {
        step: React.PropTypes.number,
        switchStep: React.PropTypes.func,
        parentState: React.PropTypes.object,
        setParentState: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            children: ""
        }
    },

    componentDidMount: function() {
        var self = this;
        var steps = [];

        // Count and report number of children
        React.Children.forEach( this.props.children, function( child ) {
            if ( child.type.displayName === "Step" ) {
                steps.push({ context: child.props.context, valid: null });
            }
        });

        this.props.setParentState({
            steps: steps
        })
    },

    render: function() {
        var self = this;

        var children = this.props.children.map(function( item, i ) {
            // TODO: This works in react 0.12.0 but given their track record for
            // breaking things that are useful, check this if the steps don't turn up

            // This is a convience wrapper that also passes some important props
            // to each step so we're DRY in our JSX.

            if ( item.type.displayName === "Step" ) {
                return React.addons.cloneWithProps(item, {
                    key: i,
                    number: i + 1,
                    active: ( self.props.step == ( i + 1 ) ),
                    switchStep: self.props.switchStep,
                    parentState: self.props.parentState,
                    setParentState: self.props.setParentState
                });
            }
        }, this);

        return (
            <div className="steps">
                { children }
            </div>
        );
    }
});

module.exports = PaginatorSteps;
