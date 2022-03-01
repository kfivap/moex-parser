import React from 'react';
import { useActions } from '../hooks/useActions';
import settings from '../icons/settings.svg'
import { useSelector } from 'react-redux';


const QueryPicker = () => {
    const { setQueryLimit } = useActions()
    const { queryLimit } = useSelector(state => { return state.main })
 

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
                   return <option key={day} selected={queryLimit === day} >{day}</option>
                })}
            </select>
            days
            <hr/>
        </div>
    );
};

export default QueryPicker;