import React, { useState, useRef } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { parseTransactionFromInput, processVoiceTransaction } from '../services/geminiService';

interface AddTransactionProps {
  onAdd: (t: Omit<Transaction, 'id'>) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

const AddTransaction: React.FC<AddTransactionProps> = ({
  onAdd,
  onCancel,
  isSubmitting = false,
  submitError,
}) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: Category.FOOD,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required.');
      return;
    }
    setFormError(null);

    await onAdd({
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date().toISOString(),
      type: TransactionType.EXPENSE, // Defaulting to expense for simplicity
    });
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    setLoading(true);
    try {
      const result = await parseTransactionFromInput(aiInput);
      if (result.amount && result.description) {
        await onAdd({
          amount: result.amount,
          description: result.description,
          category: (result.category as Category) || Category.OTHER,
          date: new Date().toISOString(),
          type: (result.type as TransactionType) || TransactionType.EXPENSE,
        });
      }
    } catch (e) {
      alert("Could not understand the input. Please try manual mode.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setLoading(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          // Strip "data:audio/wav;base64," prefix
          const rawBase64 = base64data.split(',')[1];
          try {
            const result = await processVoiceTransaction(rawBase64);
            if (result.amount && result.description) {
               await onAdd({
                amount: result.amount,
                description: result.description,
                category: (result.category as Category) || Category.OTHER,
                date: new Date().toISOString(),
                type: (result.type as TransactionType) || TransactionType.EXPENSE,
              });
            }
          } catch (err) {
            console.error(err);
            alert("Voice processing failed.");
          } finally {
            setLoading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Transaction</h2>
          <button onClick={onCancel} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'ai' ? 'bg-white shadow-sm text-primary' : 'text-subtext'}`}
          >
            ✨ AI Magic
          </button>
          <button 
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-subtext'}`}
          >
            Manual
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 animate-pulse">Processing with Gemini...</p>
          </div>
        ) : mode === 'ai' ? (
          <div className="space-y-4">
            <textarea 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g. 'Spent 150 EGP on Uber for university'"
              className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/50 resize-none h-32 text-gray-700 placeholder-gray-400"
            />
            <div className="flex gap-3">
              <button 
               onClick={recording ? stopRecording : startRecording}
               disabled={loading || isSubmitting}
               className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                 recording ? 'bg-danger text-white animate-pulse' : 'bg-gray-100 text-gray-700'
               } ${loading || isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {recording ? 'Stop' : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    Voice
                  </>
                )}
              </button>
              <button 
               onClick={handleAiSubmit}
               disabled={!aiInput.trim() || loading || isSubmitting}
               className="flex-[2] bg-primary text-white py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-600 disabled:opacity-50"
              >
                Analyze & Add
              </button>
            </div>
            <p className="text-xs text-center text-subtext mt-2">Supports Egyptian Arabic & English</p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-subtext uppercase mb-1">Amount (EGP)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-lg font-semibold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-subtext uppercase mb-1">Description</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary"
                placeholder="What did you buy?"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-subtext uppercase mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`p-2 rounded-lg text-xs font-medium transition-all border ${formData.category === cat ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            {submitError && <p className="text-sm text-red-500">{submitError}</p>}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-600 mt-4 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Add Transaction'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddTransaction;