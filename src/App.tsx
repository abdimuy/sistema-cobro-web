import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./modules/home/Home";
import Settings from "./modules/setting/Settings";
import CreateUser from "./modules/user/CreateUser";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create-user" element={<CreateUser />} />
      </Routes>
    </Router>
  );
}

export default App;
