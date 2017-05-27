import * as React from 'react';
import * as ReactDOM from 'react-dom';
/*
  Main App Container
 */
import App from './containers/App/index';

// AppContainer is a necessary wrapper component for HMR
// We use require because TypeScript type warning,
// tslint:disable
const { AppContainer } = require('react-hot-loader');

// Render function containing the HMR AppContainer
const render = (Component: any) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    // HTML root element for React app
    document.getElementById('reactContainer'),
  );
};

render(App);

// TypeScript declaration for module.hot
declare var module: { hot: any };
// Hot Module Replacement API
if(module.hot) {
  module.hot.accept('./containers/App/App', () => {
    // If we receive a HMR request for our App container,
    // then reload it using require (we can't do this dynamically with import)
    const NextApp = require('./containers/App/index').default;
    render(NextApp);
  });
}
