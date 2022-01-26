import React, { useEffect, useState } from 'react';

const IsinList = () => {
    const [isinList, setIsinList] = useState([])
    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:5000/isin')
            setIsinList(await response.json())
        }
        fetchData();
    }, [])
    return (
        <div>
            {/* <select name="select" multiple="multiple" size="20"> */}
                {isinList.map(isin => {
                    return (
                        <div className="isin" key={isin}>{isin}</div>
                    )
                })}
            {/* </select> */}
        </div>
    );
};

export default IsinList;