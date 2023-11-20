import React from 'react';
import OpenPositionsChart from './OpenPositionsChart';
import QueryPicker from './QueryPicker';

const Main = () => {
    return (
        <div className='main'>
            <QueryPicker/>
            <OpenPositionsChart/>
        </div>
    );
};

export default Main;