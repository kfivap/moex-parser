import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useActions } from '../hooks/useActions';
import IsinItem from './IsinItem';

const IsinList = () => {
    const { isinList } = useSelector(state => { return state.main })
    const { setIsinList } = useActions()
    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:5000/isin')
            const jsonData = await response.json()
            console.log(jsonData)
            setIsinList(jsonData)
            console.log(isinList)

        }
        fetchData();
    }, [])



    return (
        <div>
            {isinList.map(isin => {
                return (
                    <IsinItem isin={isin}/>
                )
            })}
        </div>
    );
};

export default IsinList;