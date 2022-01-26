import React, { useEffect, useState } from 'react';


const Graphic = () => {
    const [derivativeData, setDerivativeData] = useState([])
    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:5000/derivatives?isin=Si')
            setDerivativeData(await response.json())
        }
        fetchData();
    }, [])
    console.log({ derivativeData })
    return (
        <div>
            {/* todo react charts */}
            {derivativeData.map(der=>{
                return <div>
                    date: {der.moment}
                    ticker: {der.isin}, 
                    contract_type: {der.contract_type}, 
                    <br/>
                    long_position: {der.long_position}, 
                    short_position: {der.short_position}, 
                    <br/>
                    <br/>

                </div>
            })}
        </div>
    );
};

export default Graphic;