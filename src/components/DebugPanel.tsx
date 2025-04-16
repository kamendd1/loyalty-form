import React, { useState, useEffect } from 'react';
import '../styles/DebugPanel.css';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  data?: any;
}

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Create a proxy for console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      info: console.info
    };

    // Override console methods to capture logs
    console.log = (...args) => {
      originalConsole.log(...args);
      captureLog('info', args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      captureLog('error', args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      captureLog('warn', args);
    };

    console.debug = (...args) => {
      originalConsole.debug(...args);
      captureLog('debug', args);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      captureLog('info', args);
    };

    // Function to capture logs
    const captureLog = (level: 'info' | 'error' | 'warn' | 'debug', args: any[]) => {
      const message = args[0];
      const data = args.length > 1 ? args.slice(1) : undefined;
      
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp: new Date().toISOString(),
          level,
          message: typeof message === 'string' ? message : JSON.stringify(message),
          data: data ? JSON.stringify(data) : undefined
        }
      ]);
    };

    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
    };
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const downloadLogs = () => {
    const logText = JSON.stringify(logs, null, 2);
    const blob = new Blob([logText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button 
        className="debug-toggle-button"
        onClick={toggleVisibility}
      >
        {isVisible ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {isVisible && (
        <div className="debug-panel">
          <div className="debug-header">
            <h3>Debug Console</h3>
            <div className="debug-controls">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="debug-filter"
              >
                <option value="all">All Logs</option>
                <option value="info">Info</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="debug">Debug</option>
              </select>
              <button onClick={downloadLogs} className="debug-button">Download</button>
              <button onClick={clearLogs} className="debug-button">Clear</button>
              <button onClick={toggleVisibility} className="debug-button">Close</button>
            </div>
          </div>
          <div className="debug-log-container">
            {filteredLogs.length === 0 ? (
              <p className="no-logs">No logs to display</p>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.level}`}>
                  <div className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="log-level">[{log.level.toUpperCase()}]</div>
                  <div className="log-message">{log.message}</div>
                  {log.data && (
                    <pre className="log-data">{log.data}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
