import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import { makeStore } from './store';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={makeStore()}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
