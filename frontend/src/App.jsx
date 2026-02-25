import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import NewCampaign from './pages/NewCampaign';
import NewInstance from './pages/NewInstance';
import Instances from './pages/Instances';
import CampaignDetails from './pages/CampaignDetails';
import Automations from './pages/Automations';
import Team from './pages/Team';
import Inbox from './pages/Inbox';
import Agents from './pages/Agents';
import Integrations from './pages/Integrations';
import Workflows from './pages/Workflows';
import Contacts from './pages/Contacts';
import ContactProfile from './pages/ContactProfile';
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

        <Route path="/instances" element={
          <PrivateRoute>
            <Instances />
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

        <Route path="/automations" element={
          <PrivateRoute>
            <Automations />
          </PrivateRoute>
        } />
        
        <Route path="/team" element={
          <PrivateRoute>
            <Team />
          </PrivateRoute>
        } />

        <Route path="/inbox" element={
          <PrivateRoute>
            <Inbox />
          </PrivateRoute>
        } />

        <Route path="/agents" element={
          <PrivateRoute>
            <Agents />
          </PrivateRoute>
        } />

        <Route path="/integrations" element={
          <PrivateRoute>
            <Integrations />
          </PrivateRoute>
        } />

        <Route path="/workflows" element={
          <PrivateRoute>
            <Workflows />
          </PrivateRoute>
        } />

        <Route path="/contacts" element={
          <PrivateRoute>
            <Contacts />
          </PrivateRoute>
        } />

        <Route path="/contacts/:id" element={
          <PrivateRoute>
            <ContactProfile />
          </PrivateRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
