
import './App.css'
import HomePage from "./pages/Home/HomePage"; 
import RolesPage from "./pages/Roles/RolePage";
import DesignationM from './pages/Designation/DesignationM';  
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/designations" element={<DesignationM />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App
