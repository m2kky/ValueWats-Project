import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ValueWatsLoader from './components/ValueWatsLoader';
import Layout from './components/Layout';
import PublicLayout from './components/public/PublicLayout';

// Auth (keep eager — first screens the user sees)
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

// ── Lazy-loaded Private Pages ──────────────────────────────
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Campaigns = React.lazy(() => import('./pages/Campaigns'));
const NewCampaign = React.lazy(() => import('./pages/NewCampaign'));
const NewInstance = React.lazy(() => import('./pages/ConnectChannel'));
const Instances = React.lazy(() => import('./pages/Channels'));
const ChannelManage = React.lazy(() => import('./pages/ChannelManage'));
const CampaignDetails = React.lazy(() => import('./pages/CampaignDetails'));
const Automations = React.lazy(() => import('./pages/Automations'));
const Inbox = React.lazy(() => import('./pages/Inbox'));
const Agents = React.lazy(() => import('./pages/Agents'));
const Templates = React.lazy(() => import('./pages/Templates'));
const Workflows = React.lazy(() => import('./pages/Workflows'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const ContactProfile = React.lazy(() => import('./pages/ContactProfile'));
const Team = React.lazy(() => import('./pages/Team'));
const Integrations = React.lazy(() => import('./pages/Integrations'));
const SettingsLayout = React.lazy(() => import('./components/SettingsLayout'));

// ── Lazy-loaded Admin Pages ──────────────────────────────
const AdminRoute = React.lazy(() => import('./components/admin/AdminRoute'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTenants = React.lazy(() => import('./pages/admin/AdminTenants'));
const AdminPlans = React.lazy(() => import('./pages/admin/AdminPlans'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminLogs = React.lazy(() => import('./pages/admin/AdminLogs'));
const WorkspaceSettings = React.lazy(() => import('./pages/settings/WorkspaceSettings'));
const ContactFieldsSettings = React.lazy(() => import('./pages/settings/ContactFieldsSettings'));
const LifecycleSettings = React.lazy(() => import('./pages/settings/LifecycleSettings'));
const TagSettings = React.lazy(() => import('./pages/settings/TagSettings'));
const SnippetsSettings = React.lazy(() => import('./pages/settings/SnippetsSettings'));
const AIKnowledgeSettings = React.lazy(() => import('./pages/settings/AIKnowledgeSettings'));
const LifecycleRules = React.lazy(() => import('./pages/settings/LifecycleRules'));
const OptoutSettings = React.lazy(() => import('./pages/Settings'));

// ── Lazy-loaded Public Pages ───────────────────────────────
const Landing = React.lazy(() => import('./pages/public/Landing'));
const About = React.lazy(() => import('./pages/public/About'));
const Roadmap = React.lazy(() => import('./pages/public/Roadmap'));
const Contact = React.lazy(() => import('./pages/public/Contact'));
const Pricing = React.lazy(() => import('./pages/public/Pricing'));
const WhyUs = React.lazy(() => import('./pages/public/WhyUs'));
const Learn = React.lazy(() => import('./pages/public/resources/Learn'));
const Tools = React.lazy(() => import('./pages/public/resources/Tools'));

// Help Center Pages
const HelpCenter = React.lazy(() => import('./pages/public/help/HelpCenter'));
const SettingsHelp = React.lazy(() => import('./pages/public/help/SettingsHelp'));
const ChannelHelp = React.lazy(() => import('./pages/public/help/ChannelHelp'));
const ChannelsList = React.lazy(() => import('./pages/public/help/ChannelsList'));
const ProductHelp = React.lazy(() => import('./pages/public/help/ProductHelp'));
const FeatureHelp = React.lazy(() => import('./pages/public/help/FeatureHelp'));

// Legal Pages
const PrivacyPolicy = React.lazy(() => import('./pages/public/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/public/legal/TermsOfService'));
const CookiePolicy = React.lazy(() => import('./pages/public/legal/CookiePolicy'));
const Security = React.lazy(() => import('./pages/public/legal/Security'));
const Subprocessors = React.lazy(() => import('./pages/public/legal/Subprocessors'));
const DPA = React.lazy(() => import('./pages/public/legal/DPA'));

// ── Full-screen loader shown during transitions ────────────
function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#09090b]/90 backdrop-blur-md">
      <ValueWatsLoader size={80} text="Loading..." />
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  // Check if onboarding is completed
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.onboardingCompleted === false) {
        return <Navigate to="/onboarding" />;
      }
    }
  } catch (e) { /* ignore parse errors */ }

  return (
    <Layout>
      {children}
    </Layout>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes with PublicLayout */}
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/roadmap" element={<PublicLayout><Roadmap /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
          <Route path="/why-us" element={<PublicLayout><WhyUs /></PublicLayout>} />

          {/* Help Center Routes */}
          <Route path="/help" element={<PublicLayout><HelpCenter /></PublicLayout>} />
          <Route path="/help/product" element={<PublicLayout><ProductHelp /></PublicLayout>} />
          <Route path="/help/channels/:channel/:topic" element={<PublicLayout><ChannelHelp /></PublicLayout>} />
          <Route path="/help/channels/:channel" element={<PublicLayout><ChannelHelp /></PublicLayout>} />
          <Route path="/help/channels" element={<PublicLayout><ChannelsList /></PublicLayout>} />
          <Route path="/help/:feature/:topic" element={<PublicLayout><FeatureHelp /></PublicLayout>} />
          <Route path="/help/:feature" element={<PublicLayout><FeatureHelp /></PublicLayout>} />
          <Route path="/help/settings" element={<PublicLayout><SettingsHelp /></PublicLayout>} />
          
          <Route path="/resources/support" element={<Navigate to="/help" replace />} />
          <Route path="/resources/learn" element={<PublicLayout><Learn /></PublicLayout>} />
          <Route path="/resources/tools" element={<PublicLayout><Tools /></PublicLayout>} />

          <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><TermsOfService /></PublicLayout>} />
          <Route path="/cookie-policy" element={<PublicLayout><CookiePolicy /></PublicLayout>} />
          <Route path="/security" element={<PublicLayout><Security /></PublicLayout>} />
          <Route path="/subprocessors" element={<PublicLayout><Subprocessors /></PublicLayout>} />
          <Route path="/dpa" element={<PublicLayout><DPA /></PublicLayout>} />
          <Route path="/api-docs" element={<Navigate to="/resources/tools" replace />} />
          <Route path="/success-stories" element={<Navigate to="/resources/learn" replace />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

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

          <Route path="/channels" element={
            <PrivateRoute>
              <Instances />
            </PrivateRoute>
          } />

          <Route path="/channels/connect/:type" element={
            <PrivateRoute>
              <NewInstance />
            </PrivateRoute>
          } />

          <Route path="/channels/manage/:instanceId" element={
            <PrivateRoute>
              <ChannelManage />
            </PrivateRoute>
          } />

          {/* Super Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/tenants" element={
            <AdminRoute>
              <AdminTenants />
            </AdminRoute>
          } />
          <Route path="/admin/plans" element={
            <AdminRoute>
              <AdminPlans />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/logs" element={
            <AdminRoute>
              <AdminLogs />
            </AdminRoute>
          } />

          {/* Legacy Redirects */}
          <Route path="/instances" element={<Navigate to="/channels" replace />} />
          <Route path="/instances/new" element={<Navigate to="/channels" replace />} />

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
              <Navigate to="/settings/users" replace />
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

          <Route path="/templates" element={
            <PrivateRoute>
              <Templates />
            </PrivateRoute>
          } />

          <Route path="/integrations" element={
            <PrivateRoute>
              <Navigate to="/settings/integrations" replace />
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute>
              <SettingsLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/settings/general" replace />} />
            <Route path="general" element={<WorkspaceSettings />} />
            <Route path="users" element={<Team />} />
            <Route path="contact-fields" element={<ContactFieldsSettings />} />
            <Route path="tags" element={<TagSettings />} />
            <Route path="lifecycle" element={<LifecycleSettings />} />
            <Route path="automation" element={<LifecycleRules />} />
            <Route path="snippets" element={<SnippetsSettings />} />
            <Route path="ai-knowledge" element={<AIKnowledgeSettings />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="optout" element={<OptoutSettings />} />
          </Route>

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
          {/* Fallback 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter >
  );
}

export default App;
