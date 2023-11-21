import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import moment from 'moment'
import SelectedIsinCard from './SelectedIsinCard';
import { useSelector } from 'react-redux';
import { useActions } from '../hooks/useActions';
import { reduceArraySize } from '../utils/reduceArraySize';
import type { RootState } from '../store/reducers'
import type { ApiDerivative, ApiDerivativesResponse, ApiMatchDerivative } from '../../../common/types'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


const OpenPositionsChart = () => {
    const { currentIsin, queryLimit } = useSelector((state: RootState) => { return state.main })
    const { setCurrentIsinDerivativeData } = useActions()
    const MAX_DATA_LEN = 150


    const [derivativeData, setDerivativeData] = useState<ApiDerivativesResponse>()
    useEffect(() => {
        async function fetchData() {
            if (!currentIsin) return

            const response = await fetch(`http://localhost:5000/derivatives?isin=${currentIsin?.derivative.isin}&limit=${queryLimit}`)
            const respJson = await response.json() as ApiDerivativesResponse
            console.log(respJson)
            setDerivativeData(respJson)
            setCurrentIsinDerivativeData({
                fiz: respJson.fizDerivatives[1], 
                legal: respJson.legalDerivatives[1],
                match: respJson.matchData[1]
            })
        }
        fetchData();
    }, [currentIsin, queryLimit])
    if (!derivativeData) {
        return <h1>please set isin</h1>
    }

    const getLabels = () => {
        const result = derivativeData.fizDerivatives.map(der => moment(der.date).format('DD-MM-YY'))
        return reduceArraySize(result, MAX_DATA_LEN)
    }
    const getOpenPositionsData = (izFiz: keyof ApiDerivativesResponse, positionType: keyof ApiDerivative) => {
        const result = derivativeData[izFiz].map(der => der[positionType]) // number array
        return reduceArraySize(result, MAX_DATA_LEN)
    }

    // legalLongToFizLong , legalShortToFizShort , legalShortToFizLong , legalLongToFizShort
    const getMatchingData = (dataType: keyof ApiMatchDerivative) => {
        const result = derivativeData.matchData?.map(data => data[dataType]) // number array
        return reduceArraySize(result, MAX_DATA_LEN)
    }

    return (
        <div>
            <SelectedIsinCard />

            <div className='chart-block'>
                <Line options={{
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                    scales: {
                        x: {
                            reverse: true
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                        }
                    },
                }}
                    data={{
                        labels: getLabels(),
                        datasets: [
                            {
                                label: 'Fiz Short',
                                data: getOpenPositionsData('fizDerivatives', 'short_position'),
                                borderColor: '#de1212',
                                yAxisID: 'y',
                            },
                            {
                                label: 'Fiz Long',
                                data: getOpenPositionsData('fizDerivatives', 'long_position'),
                                borderColor: '#24c0e3',
                                yAxisID: 'y',
                            },
                            {
                                label: 'Legal Short',
                                data: getOpenPositionsData('legalDerivatives', 'short_position'),
                                borderColor: '#ff9500',
                                yAxisID: 'y',
                            },
                            {
                                label: 'legal Long',
                                data: getOpenPositionsData('legalDerivatives', 'long_position'),
                                borderColor: '#22ff00',
                                yAxisID: 'y',
                            },

                            {
                                label: 'Legal LONG fiz LONG',
                                data: getMatchingData('legal_long_to_fiz_long'),
                                borderColor: '#031cfc',
                                borderDash: [5, 15],
                                yAxisID: 'y1',
                            },
                            {
                                label: 'Legal SHORT fiz SHORT',
                                data: getMatchingData('legal_short_to_fiz_short'),
                                borderColor: '#fc03cf',
                                borderDash: [5, 15],
                                yAxisID: 'y1',
                            },

                            {
                                label: 'Legal SHORT to fiz LONG',
                                data: getMatchingData('legal_short_to_fiz_long'),
                                borderColor: '#fc0303',
                                borderDash: [5, 5],
                                yAxisID: 'y1',
                            },
                            {
                                label: 'Legal LONG to fiz SHORT',
                                data: getMatchingData('legal_long_to_fiz_short'),
                                borderColor: '#20fc03',
                                borderDash: [5, 5],
                                yAxisID: 'y1',
                            }
                        ],
                    }} />
            </div>
        </div>
    );
};

export default OpenPositionsChart;