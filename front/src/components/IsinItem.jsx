import React from 'react';
import { useSelector } from 'react-redux';
import { useActions } from '../hooks/useActions';

const IsinItem = ({isin}) => {
    const { currentIsin } = useSelector(state => { return state.main })
    const { setCurrentIsin } = useActions()

    function setCurrentIsinHadnler(){
        setCurrentIsin(this.isin)
    }

    return (
        <div className={`isin ${currentIsin === isin ? 'isin isin-selected' : 'isin isin-notSelected'}`} key={isin} onClick={setCurrentIsinHadnler.bind({isin})}>{isin}</div>
    );
};

export default IsinItem;