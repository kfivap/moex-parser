import React from 'react';
import { useSelector } from 'react-redux';

const SelectedIsinCard = () => {
    const { currentIsin } = useSelector(state => { return state.main })
    return (
        <div>
            <h3>{currentIsin}</h3>
        </div>
    );
};

export default SelectedIsinCard;