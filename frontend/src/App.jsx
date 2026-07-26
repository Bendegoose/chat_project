import { useState } from 'react';
import Test from './components/Test'
import Register from './components/Register'

function App() {
  const [permission, setPermission] = useState('default');


  return (
    <div>
      <Test/>
      <Register/>
    </div>
  );
}

export default App;