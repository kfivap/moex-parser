import Main from "./components/Main";
import Sidebar from "./components/Sidebar";
import "./App.css";
import { useEffect } from "react";

function App() {
  //temporary
  useEffect(() => {
    async function fetchData(){
      await fetch('http://localhost:5000/fetch-data')
    }
    fetchData()
  }, [])

  return (
    <div className="App">
      <Sidebar />
      <Main />
    </div>
  );
}
export default App;
