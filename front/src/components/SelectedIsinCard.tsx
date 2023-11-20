import React from 'react';
import { useSelector } from 'react-redux';
import { formatToFixedPretty } from 'src/utils/formatNumbers';
import type { RootState } from '../store/reducers'

const SelectedIsinCard = () => {
    const { currentIsin } = useSelector((state: RootState) => { return state.main })
    const { currentIsinDerivativeData } = useSelector((state: RootState) => { return state.main })
    if (!currentIsin) return null
    return (
        <div className='selected-isin-card'>
            <h3>{currentIsin?.isin}</h3>
            <h5>{currentIsin?.name}</h5>
            name: {currentIsinDerivativeData?.fiz?.name} <br />
            date: {currentIsinDerivativeData?.fiz?.date} <br />
            total positions: {currentIsin?._sum?.short_position + currentIsin?._sum?.long_position}
            <br />
            <div className='isin-info-container'>

                <div className='isin-info-elem'>
                    <b>fiz</b> <br />
                    clients in long: {currentIsinDerivativeData?.fiz?.clients_in_long} <br />
                    clients in short: {currentIsinDerivativeData?.fiz?.clients_in_short} <br />
                    total clients: {(currentIsinDerivativeData?.fiz?.clients_in_short || 0) + (currentIsinDerivativeData?.fiz?.clients_in_long || 0)} <br />
                    <hr />
                    long positions: {currentIsinDerivativeData?.fiz?.long_position} <br />
                    short positions: {currentIsinDerivativeData?.fiz?.short_position} <br />
                    total positions: {(currentIsinDerivativeData?.fiz?.short_position || 0) + (currentIsinDerivativeData?.fiz?.long_position || 0)} <br />
                </div>
                <div className='isin-info-elem'>
                    <b>legal</b> <br />
                    clients in long: {currentIsinDerivativeData?.legal?.clients_in_long}<br />
                    clients in short: {currentIsinDerivativeData?.legal?.clients_in_short}<br />
                    total clients: {(currentIsinDerivativeData?.legal?.clients_in_short || 0) + (currentIsinDerivativeData?.legal?.clients_in_long || 0)} <br />
                    <hr />
                    long positions: {currentIsinDerivativeData?.legal?.long_position}<br />
                    short positions: {currentIsinDerivativeData?.legal?.short_position}<br />
                    total positions: {(currentIsinDerivativeData?.legal?.short_position || 0) + (currentIsinDerivativeData?.legal?.long_position || 0)} <br />

                </div>
                <div className='isin-info-elem'>
                    <b>match data</b> <br />
                    <hr />
                    Legal LONG to fiz LONG: {formatToFixedPretty(currentIsinDerivativeData?.match?.legal_long_to_fiz_long)}<br />
                    Legal SHORT to fiz SHORT: {formatToFixedPretty(currentIsinDerivativeData?.match?.legal_short_to_fiz_short)}<br />
                    Legal SHORT to fiz LONG: {formatToFixedPretty(currentIsinDerivativeData?.match?.legal_short_to_fiz_long)}<br />
                    Legal LONG to fiz SHORT: {formatToFixedPretty(currentIsinDerivativeData?.match?.legal_long_to_fiz_short)}<br />
                </div>
            </div>


        </div>
    );
};

export default SelectedIsinCard;