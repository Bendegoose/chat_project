import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <div>
            <h1>Ügyes vagy</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}
