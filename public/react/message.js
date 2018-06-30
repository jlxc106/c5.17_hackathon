import React from 'react';


const Message = (props) => {
    const {message, type, user} = props;
    if(type==='serverMessage'){
        return(
            <li className="li-server-message">{message.message}</li>
        )
    }
    else if(type==='sendMessage'){
        var colorClass = 'message-white';
        if(message.from === user){
            colorClass = 'message-black';
        }
        return(
            <li className={"li-message " + colorClass}><span>{message.from}</span>: {message.message}</li>
        )
    }

}


export default Message