import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useActions } from '../hooks/useActions';

const IsinList = () => {
    const { isin } = useSelector(state => { return state.main })
    const { setIsin } = useActions()
    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:5000/isin')
            const jsonData = await response.json()
            console.log(jsonData)
            setIsin(jsonData)
            console.log(isin)

        }
        fetchData();
    }, [])

    return (
        <div>
            {isin.map(isin => {
                return (
                    <div className="isin" key={isin}>{isin}</div>
                )
            })}
        </div>
    );
};

export default IsinList;