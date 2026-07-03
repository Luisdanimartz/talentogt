import "./App.css";

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Companies from "./pages/Companies";
import CreateCV from "./pages/CreateCV";
import Dashboard from "./pages/candidate/Dashboard";

function App() {
  return (
    <div className="container">

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/empleos" element={<Jobs />} />

        <Route path="/empresas" element={<Companies />} />

        <Route path="/crear-cv" element={<CreateCV />} />

        <Route
          path="/candidato/dashboard"
          element={<Dashboard />}
        />

      </Routes>

    </div>
  );
}

export default App;