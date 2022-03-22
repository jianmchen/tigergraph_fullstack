import "./App.css";
import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.js";
import Second from "./pages/Second.js";
import NavBar from "./modules/NavBar.js";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <div>
      <>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/second" element={<Second />}></Route>
          </Routes>
        </BrowserRouter>
      </>
    </div>
  );
};

export default App;
