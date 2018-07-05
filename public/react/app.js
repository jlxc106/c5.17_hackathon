import React from 'react';
import {Route, Switch} from 'react-router-dom';
import HomePage from './index.js';
import OthelloDuo from './othello_duo.js';
import OthelloSolo from './othello_solo.js';
import OthelloSoloAI from './othello_solo_ai';

const App = () => {
    return (
        <div className="">
            <Route path="/othello_duo" component={OthelloDuo} />
            <Route path="/othello_solo" component={OthelloSolo} />
            <Route path="/othello_solo_ai" component={OthelloSoloAI}/>
            <Route exact path="/" component={HomePage} />
        </div>
    );
  
}

export default App;


