import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useActions } from '../hooks/useActions';
import IsinItem from './IsinItem';
import type { RootState } from '../store/reducers'
import type { ApiIsinListResponse } from '../../../common/types'


const IsinList = () => {
    const { isinList } = useSelector((state: RootState) => { return state.main })
    const { setIsinList } = useActions()
    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:5000/isin')
            const jsonData = await response.json() as ApiIsinListResponse
            setIsinList(jsonData)

        }
        fetchData();
    }, [])



    return (
        <div>
            {isinList.map(isin => {
                return (
                    <IsinItem key={isin.derivative.isin} isin={isin} />
                )
            })}
        </div>
    );
};

export default IsinList;