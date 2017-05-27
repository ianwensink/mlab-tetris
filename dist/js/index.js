"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
/*
  Main App Container
 */
const App_1 = require("./containers/App/App");
// AppContainer is a necessary wrapper component for HMR
// We use require because TypeScript type warning,
// tslint:disable
const { AppContainer } = require('react-hot-loader');
// Render function containing the HMR AppContainer
const render = (Component) => {
    ReactDOM.render(React.createElement(AppContainer, null,
        React.createElement(Component, null)), 
    // HTML root element for React app
    document.getElementById('reactContainer'));
};
render(App_1.default);
// Hot Module Replacement API
if (module.hot) {
    module.hot.accept('./containers/App/App', () => {
        // If we receive a HMR request for our App container,
        // then reload it using require (we can't do this dynamically with import)
        const NextApp = require('./containers/App/App').default;
        render(NextApp);
    });
}
//# sourceMappingURL=index.js.map