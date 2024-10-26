// src/components/AudioUploader.tsx
import React, { useState } from 'react';

const AudioUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const uploadAudio = async () => {
    if (!file) return;

    setLoading(true);

    // Load ffmpeg and convert the audio
    const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
    const ffmpeg = createFFmpeg({ log: true });

    await ffmpeg.load();
    ffmpeg.FS('writeFile', 'input.wav', await fetchFile(file));
    await ffmpeg.run('-i', 'input.wav', '-ar', '24000', 'output.wav');

    // Read the converted audio file
    const data = ffmpeg.FS('readFile', 'output.wav');

    // Prepare the audio data for ONNX Runtime
    const audioBuffer = new Uint8Array(data.buffer);

    // Initialize ONNX Runtime and encode the audio
    const ort = require('onnxruntime-web');

    // Load the EnCodec model (ensure you have the correct path to the model)
    const session = await ort.InferenceSession.create('/path/to/encodec/model.onnx');
    const inputTensor = new ort.Tensor('float32', audioBuffer, [1, audioBuffer.length]);
    
    // Run inference
    const output = await session.run({ input: inputTensor });
    const encodedAudio = output.output.data;

    // Send the encoded audio to the backend
    await fetch('http://localhost:8000/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: Array.from(encodedAudio) }),
    });

    setLoading(false);
    alert('Audio uploaded successfully!');
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={uploadAudio} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Audio'}
      </button>
    </div>
  );
};

export default AudioUploader;
