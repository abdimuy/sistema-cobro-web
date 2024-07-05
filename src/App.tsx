import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./modules/home/Home";
import Settings from "./modules/setting/Settings";
import CreateUser from "./modules/user/CreateUser";
import { LoadScript } from "@react-google-maps/api";

function App() {
  return (
    <Router>
      <LoadScript googleMapsApiKey="AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/create-user" element={<CreateUser />} />
        </Routes>
      </LoadScript>
    </Router>
  );
}

export default App;
