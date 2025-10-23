import React, { useState } from 'react';
import useSessionErrorHandler from '../../../hooks/useSessionErrorHandler';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { diagnoseCsrfIssues } from '../../../utils/csrfDiagnostic';
import api from '../../../utils/axios';
import auth from '../../../utils/auth';

const SystemDiagnostics = () => {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csrfFixing, setCsrfFixing] = useState(false);

  const handleSessionError = useSessionErrorHandler();

  // Run diagnostic tests
  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Create a console capture to record diagnostics
      const logs = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.log = (...args) => {
        logs.push({ type: 'log', message: args.join(' ') });
        originalConsoleLog(...args);
      };
      
      console.error = (...args) => {
        logs.push({ type: 'error', message: args.join(' ') });
        originalConsoleError(...args);
      };
      
      console.warn = (...args) => {
        logs.push({ type: 'warning', message: args.join(' ') });
        originalConsoleWarn(...args);
      };
      
      // Run diagnostics
      await diagnoseCsrfIssues();
      
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      
      // Update state with results
      setDiagnosticResults(logs);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      handleSessionError(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Attempt to fix CSRF issues by refreshing tokens
  const fixCsrfIssues = async () => {
    setCsrfFixing(true);
    try {
      // 1. Clear existing auth tokens
      auth.logout();
      
      // 2. Make a request to health check endpoint to get fresh CSRF token
      await api.get('/auth/health-check/');
      
      // 3. Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error fixing CSRF issues:', error);
    } finally {
      setCsrfFixing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading-semibold text-text-primary">System Diagnostics</h2>
          <p className="text-sm text-text-secondary">Troubleshoot CSRF and authentication issues</p>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            {loading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Search" size={16} />}
            <span>Run Diagnostics</span>
          </Button>
          
          <Button 
            onClick={fixCsrfIssues}
            disabled={csrfFixing}
            variant="danger"
            className="flex items-center space-x-1"
          >
            {csrfFixing ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="RefreshCw" size={16} />}
            <span>Fix & Restart</span>
          </Button>
        </div>
      </div>
      
      {diagnosticResults && (
        <div className="bg-background rounded-lg border border-border p-4 overflow-auto max-h-96">
          <div className="font-mono text-xs">
            {diagnosticResults.map((log, index) => (
              <div 
                key={index}
                className={`py-1 ${
                  log.type === 'error' 
                    ? 'text-error' 
                    : log.type === 'warning' 
                    ? 'text-warning' 
                    : 'text-text-primary'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemDiagnostics;