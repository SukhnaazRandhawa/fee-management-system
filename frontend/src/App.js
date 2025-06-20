import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/DashboardLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AmountView from './pages/views/AmountView';
import ClassesView from './pages/views/ClassesView';
import PayFeeView from './pages/views/PayFeeView';
import RegisterView from './pages/views/RegisterView';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route path="" element={<DashboardLayout />}>
              <Route index element={<Navigate to="classes" replace />} />
              <Route path="classes" element={<ClassesView />} />
              <Route path="amount" element={<AmountView />} />
              <Route path="register" element={<RegisterView />} />
              <Route path="payfee" element={<PayFeeView />} />
            </Route>
          </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
