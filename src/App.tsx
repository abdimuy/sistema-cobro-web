import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./modules/home/Home";
import Settings from "./modules/setting/Settings";
import CreateUser from "./modules/user/CreateUser";
import { LoadScript } from "@react-google-maps/api";
import Sales from "./modules/sales/Sales";
import Garantias from "./modules/garantias/Garantias";
import GarantiaDetalle from "./modules/garantias/GarantiaDetails";

function App() {
  return (
    <Router>
      <LoadScript googleMapsApiKey="AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/garantias" element={<Garantias />} />
          <Route path="/garantias/:id" element={<GarantiaDetalle />} />
        </Routes>
      </LoadScript>
    </Router>
  );
}

export default App;
