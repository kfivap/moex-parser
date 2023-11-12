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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


const Graphic = () => {
    const { currentIsin, queryLimit } = useSelector(state => { return state.main })
    const { setCurrentIsinDerivativeData } = useActions()


    const [derivativeData, setDerivativeData] = useState()
    useEffect(() => {
        async function fetchData() {
            if (!currentIsin) return

            const response = await fetch(`http://localhost:5000/derivatives?isin=${currentIsin?.isin}&limit=${queryLimit}`)
            const respJson = await response.json()
            setDerivativeData(respJson)
            setCurrentIsinDerivativeData({ fiz: respJson.fizDerivatives[respJson.fizDerivatives.length - 1], legal: respJson.legalDerivatives[respJson.legalDerivatives.length - 1], match: respJson.matchData[respJson.matchData.length - 1] })
        }
        fetchData();
    }, [currentIsin, queryLimit])
    if (!derivativeData) {
        return <h1>please set isin</h1>
    }

    const getLabels = () => {
        return derivativeData.fizDerivatives.map(der => moment(der.date).format('DD-MM-YY'))
    }
    const getGraphicData = (izFiz, positionType) => {
        return derivativeData[izFiz].map(der => der[positionType])
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
                        }
                    },
                }}
                    data={
                        {
                            labels: getLabels(),
                            datasets: [
                                {
                                    label: 'Fiz Short',
                                    data: getGraphicData('fizDerivatives', 'short_position'),
                                    borderColor: '#de1212',
                                },
                                {
                                    label: 'Fiz Long',
                                    data: getGraphicData('fizDerivatives', 'long_position'),
                                    borderColor: '#24c0e3',
                                },
                                {
                                    label: 'Legal Short',
                                    data: getGraphicData('legalDerivatives', 'short_position'),
                                    borderColor: '#ff9500',
                                },
                                {
                                    label: 'legal Long',
                                    data: getGraphicData('legalDerivatives', 'long_position'),
                                    borderColor: '#22ff00',
                                    // backgroundColor: '22ff00',
                                },
                            ],
                        }
                    } />
            </div>
        </div>
    );
};

export default Graphic;