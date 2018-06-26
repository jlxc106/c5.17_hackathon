import React from 'react';
import ReactDOM from 'react-dom';
import App from './public/react/app';
import {BrowserRouter as Router} from 'react-router-dom';

ReactDOM.render(
    <Router>
        <App />
    </Router>,
    document.getElementById('app')
)
