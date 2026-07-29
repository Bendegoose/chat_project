import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import Auth from './components/Auth';
import ProtectedRoutes from './utils/ProtectedRoutes';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Auth />} path='/auth' />
          <Route element={<ProtectedRoutes />}>
            <Route element={<Chat />} path='/' />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
