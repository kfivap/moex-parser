import React, { useEffect } from 'react';
import { useActions } from '../hooks/useActions';
import settings from '../icons/settings.svg'

const QueryPicker = () => {
    const { setQueryLimit } = useActions()
    useEffect(() => {
        setQueryLimit(days[3])
    }, [])

    function changeLimitHandler(e) {
        setQueryLimit(e.target.value)
    }

    const days = [14, 30, 60, 120, 180, 365, 730, 1500, 99999]

    return (
        <div className='query-picker-main'>
            <img src={settings} className='settings-icon'/> 
            Show last
            <select className='query-picker-select' onChange={changeLimitHandler}>
                {days.map((day)=>{
                   return <option key={day} >{day}</option>
                })}
            </select>
            days
            <hr/>
        </div>
    );
};

export default QueryPicker;