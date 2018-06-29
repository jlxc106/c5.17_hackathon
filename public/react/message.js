import React from 'react';


const Message = (props) => {
    const {message, type} = props;
    if(type==='serverMessage'){
        return(
            <li className="li-server-message">{message.message}</li>
        )
    }
    else if(type==='sendMessage'){
        return(
            <li className="li-message"><span>{message.from}</span>: {message.message}</li>
        )
    }

}


export default Message