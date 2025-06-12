import { useState } from 'react';

const Frontend = ({ onUpdate }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!input.trim()) return;
    
    try {
      setLoading(true);
      await onUpdate(input);
      setInput("");
    } catch (error) {
      console.error('Error updating greeting:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Please wait...</p>
        <p>Updating greeting...</p>
      </div>
    );
  }

  return (
    <div className="frontend-container">
      <div className="input-section">
        
      </div>
    </div>
  );
};

export default Frontend;
