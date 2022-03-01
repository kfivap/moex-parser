import React from 'react';
import Graphic from './Graphic';
import QueryPicker from './QueryPicker';

const Main = () => {
    return (
        <div className='main'>
            <QueryPicker/>
            <Graphic/>
        </div>
    );
};

export default Main;