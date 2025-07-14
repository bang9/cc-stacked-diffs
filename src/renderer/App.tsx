import React from 'react';
import { useStore } from './store/useStore';
import DiffViewer from './components/DiffViewer';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <DiffViewer />
        </main>
      </div>
    </div>
  );
}

export default App;