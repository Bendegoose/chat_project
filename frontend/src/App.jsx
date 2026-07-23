import { useState } from 'react';
import Test from './components/Test'

function App() {
  const [permission, setPermission] = useState('default');


  async function subscribeToPush() {

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    new Notification("Siker!", {
      body: "Az értesítések működnek 🎉",
      icon: "/icon.png"
    });
  }else{
    alert("big nono")
  }

}

  return (
    <div>
      <button onClick={subscribeToPush}>
        🔔 Push noti beállítása
      </button>
      <Test/>
    </div>
  );
}

export default App;