import React from 'react';
import { useSelector } from 'react-redux';
import { ApiIsin } from '../../../common/types';
import { useActions } from '../hooks/useActions';
import type { RootState } from '../store/reducers'

const IsinItem = ({ isin }: {isin: ApiIsin}) => {
    const { currentIsin } = useSelector((state: RootState) => { return state.main })
    const { setCurrentIsin } = useActions()
    function setCurrentIsinHandler() {
        setCurrentIsin(this.isin)
    }
    return (
        <div className={`isin ${currentIsin?.derivative.isin === isin.derivative.isin ? 'isin isin-selected' : 'isin isin-notSelected'}`} onClick={setCurrentIsinHandler.bind({ isin })}>{isin.derivative.isin}</div>
    );
};

export default IsinItem;