import { useState } from 'react';

export default function Register() {
    const [userData, setUserData] = useState({})

    const onChange = (e) => setUserData({
        ...userData,
        [e.target.id]: e.target.value
    })

    async function handleRegister(e) {
        e.preventDefault();

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            console.log("Success:", data);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <form onSubmit={handleRegister}>
            <div>
                <label htmlFor="username">Username</label>
                <input id="username" type="text" onChange={onChange} required />
            </div>

            <div>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" onChange={onChange} required />
            </div>

            <div>
                <label htmlFor="inviteCode">Invite Code</label>
                <input id="inviteCode" type="text" onChange={onChange} required />
            </div>

            <button type="submit">
                Sign Up
            </button>
        </form>
    );
}