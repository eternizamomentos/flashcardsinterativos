import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Study from './pages/Study';
import Settings from './pages/Settings';
import { StoreProvider } from './contexts/StoreContext';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create" element={<Editor />} />
              <Route path="/edit/:id" element={<Editor />} />
              <Route path="/study/:id" element={<Study />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
};

export default App;
