import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import NewCampaign from './pages/NewCampaign';
import NewInstance from './pages/NewInstance';
import CampaignDetails from './pages/CampaignDetails';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? (
    <Layout>
      {children}
    </Layout>
  ) : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/campaigns" element={
          <PrivateRoute>
            <Campaigns />
          </PrivateRoute>
        } />
        
        <Route path="/campaigns/new" element={
          <PrivateRoute>
            <NewCampaign />
          </PrivateRoute>
        } />

        <Route path="/instances/new" element={
          <PrivateRoute>
            <NewInstance />
          </PrivateRoute>
        } />

        <Route path="/campaigns/:id" element={
          <PrivateRoute>
            <CampaignDetails />
          </PrivateRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
