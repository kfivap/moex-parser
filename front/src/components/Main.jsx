import React from 'react';
import Graphic from './Graphic';
import SelectedIsinCard from './SelectedIsinCard';

const Main = () => {
    return (
        <div className='main'>
            <SelectedIsinCard/>
            <Graphic></Graphic>
        </div>
    );
};

export default Main;