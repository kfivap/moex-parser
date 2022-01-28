import React from 'react';
import { useSelector } from 'react-redux';

const SelectedIsinCard = () => {
    const { currentIsin } = useSelector(state => { return state.main })
    const { currentIsinDerivativeData } = useSelector(state => { return state.main })
    console.log(currentIsinDerivativeData)
    if (!currentIsin) return null
    return (
        <div className='selected-isin-card'>
            <h3>{currentIsin?.isin}</h3>
            <h5>{currentIsin?.name}</h5>
            date: {currentIsinDerivativeData?.fiz?.date}
            <br />
            <div className='isin-info-container'>

                <div className='isin-info-elem'>
                    <b>fiz</b> <br />
                    clients in long: {currentIsinDerivativeData?.fiz?.clients_in_long} <br />
                    clients in short: {currentIsinDerivativeData?.fiz?.clients_in_short} <br />
                    long positions: {currentIsinDerivativeData?.fiz?.long_position} <br />
                    short positions: {currentIsinDerivativeData?.fiz?.short_position} <br />
                </div>
                <div className='isin-info-elem'>
                    <b>legal</b> <br />
                    clients in long: {currentIsinDerivativeData?.legal?.clients_in_long}<br />
                    clients in short: {currentIsinDerivativeData?.legal?.clients_in_short}<br />
                    long positions: {currentIsinDerivativeData?.legal?.long_position}<br />
                    short positions: {currentIsinDerivativeData?.legal?.short_position}<br />
                </div>
                <div className='isin-info-elem'>
                    <b>difference</b> <br />
                    legal/fiz clients in long {(currentIsinDerivativeData?.legal?.clients_in_long / currentIsinDerivativeData?.fiz?.clients_in_long).toFixed(2)}<br />
                    legal/fiz clients in short: {(currentIsinDerivativeData?.legal?.clients_in_short / currentIsinDerivativeData?.fiz?.clients_in_long).toFixed(2)}<br />
                    legal/fiz long position {(currentIsinDerivativeData?.legal?.long_position / currentIsinDerivativeData?.fiz?.long_position).toFixed(2)}<br />
                    legal/fiz short position {(currentIsinDerivativeData?.legal?.short_position / currentIsinDerivativeData?.fiz?.short_position).toFixed(2)}<br />
                </div>
            </div>


        </div>
    );
};

export default SelectedIsinCard;