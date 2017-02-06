import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import _ from 'lodash';

if (process.env.NODE_ENV !== 'PRODUCTION') {
  window._ = _;
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
