import React from "react";
import Segmentation from "./components/Segmentation/Segmentation";
import "./App.css";

const handleChange = coords => console.log("result: ", coords);

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{ height: 100 }}>
        Header
      </header>
      <Segmentation onChange={handleChange} />
    </div>
  );
}

export default App;
