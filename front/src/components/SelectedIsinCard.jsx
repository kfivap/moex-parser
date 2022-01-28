import React from 'react';
import { useSelector } from 'react-redux';

const SelectedIsinCard = () => {
    const { currentIsin } = useSelector(state => { return state.main })
    const { currentIsinDerivativeData } = useSelector(state => { return state.main })
    console.log(currentIsinDerivativeData)
    if (!currentIsin) return null
    return (
        <div>
            <h3>{currentIsin?.isin}</h3>
            <h5>{currentIsin?.name}</h5>
            Data:
            date: {currentIsinDerivativeData?.fiz?.date}
            <br />
            <p>
                fiz <br />
                clients in long: {currentIsinDerivativeData?.fiz?.clients_in_long} <br />
                long position: {currentIsinDerivativeData?.fiz?.long_position} <br />
                clients in short: {currentIsinDerivativeData?.fiz?.clients_in_short} <br />
                clients short position: {currentIsinDerivativeData?.fiz?.short_position} <br />
            </p>
            <p>
                legal <br />
                clients in long: {currentIsinDerivativeData?.legal?.clients_in_long}<br />
                clients in short: {currentIsinDerivativeData?.legal?.clients_in_short}<br />
                clients long position {currentIsinDerivativeData?.legal?.long_position}<br />
                clients short position {currentIsinDerivativeData?.legal?.short_position}<br />
            </p>

        </div>
    );
};

export default SelectedIsinCard;