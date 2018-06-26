import React from 'react';
import Cell from './cell'
const Row = (props) =>{
    const {rowItem, rowNum, callback} = props;
    const rowId = `row${rowNum}`;

    const listOfCells = rowItem.map((cellItem,index) =>{
        return <Cell key={index} value={cellItem} rowNum={rowNum} colNum={index} callback={callback}/>
    })

    return(
        <div className="rows" id={rowId}>
            {listOfCells}
        </div>
    )

}


export default Row;