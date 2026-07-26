import { useState, useEffect } from 'react';

function Fetch({ onSelect }) {
    const [data, setData] = useState([]);

    /* useEffect(() => {
        async function fetchData() {
            const response = await fetch('/api/users');
            const data = await response.json();
            setData(data);
            console.log(data);
        }
        fetchData();
    }, []); */

    return (
        <div className="d-flex justify-content-center my-2">
            sd
        </div>
    );
}

export default Fetch