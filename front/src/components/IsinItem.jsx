import React from 'react';
import { useSelector } from 'react-redux';
import { useActions } from '../hooks/useActions';

const IsinItem = ({ isin }) => {
    const { currentIsin } = useSelector(state => { return state.main })
    const { setCurrentIsin } = useActions()
    function setCurrentIsinHandler() {
        setCurrentIsin(this.isin)
    }
    return (
        <div className={`isin ${currentIsin === isin.isin ? 'isin isin-selected' : 'isin isin-notSelected'}`} onClick={setCurrentIsinHandler.bind({ isin })}>{isin.isin}</div>
    );
};

export default IsinItem;