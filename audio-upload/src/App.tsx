// src/App.tsx
import React from 'react';
import AudioUploader from './components/AudioUploader';

const App: React.FC = () => {
  return (
    <div>
      <h1>Audio Upload and Encode</h1>
      <AudioUploader />
    </div>
  );
};

export default App;
