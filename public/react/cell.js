import React from 'react';

const Cell = (props) =>{
    const {value, rowNum, colNum, callback} = props;
    const col_list =['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let classIdentifier = "";
    if(value === "w"){
        classIdentifier = "white-disc";
    }
    else if(value ==="b"){
        classIdentifier = "black-disc";
    }
    else if(value === "a"){
        classIdentifier = "allowedSpot"
    }
    
    return (
    <div className={classIdentifier} col={col_list[colNum]} row={rowNum} onClick={()=>{callback(rowNum, colNum)}}></div>
    )
}


export default Cell;