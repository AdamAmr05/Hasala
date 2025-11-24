import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, X, Keyboard } from 'lucide-react';
import { aiApi, TransactionPayload } from '../services/api';
import { Category, TransactionType } from '../types';

interface SmartInputSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: (tx: TransactionPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

type InputMode = 'idle' | 'text' | 'voice' | 'processing';

const SmartInputSheet: React.FC<SmartInputSheetProps> = ({
  isOpen,
  onClose,
  onTransactionAdded,
  isSubmitting = false,
  submitError,
}) => {
  const [mode, setMode] = useState<InputMode>('idle');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMode('idle');
      setTextInput('');
      setLocalError(null);
      setTransactionType(TransactionType.EXPENSE); // Reset to expense by default
    } else {
      setIsRecording(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'text' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const buildPayload = (result?: Partial<{ amount?: number; description?: string; category?: string; type?: TransactionType; relatedPerson?: string }>): TransactionPayload | null => {
    if (!result || result.amount === undefined || !result.description) {
      return null;
    }
    const amount = Number(result.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return null;
    }

    return {
      amount,
      description: result.description.trim(),
      category: (result.category as Category) || (transactionType === TransactionType.INCOME ? Category.INCOME : Category.OTHER),
      type: transactionType, // Force the selected type
      date: new Date().toISOString(),
      relatedPerson: result.relatedPerson,
    };
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setMode('processing');
    setLocalError(null);
    try {
      const result = await aiApi.parseText(textInput);
      const payload = buildPayload(result);
      if (!payload) {
        throw new Error('Could not understand the input. Try rephrasing.');
      }
      await onTransactionAdded(payload);
      onClose();
    } catch (error) {
      console.error('Failed to parse text:', error);
      setLocalError('Could not understand that. Try again or switch to manual.');
      setMode('text');
    }
  };

  const startRecording = async () => {
    if (isSubmitting || mode === 'processing') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          if (reader.result && typeof reader.result === 'string') {
            setMode('processing');
            setLocalError(null);
            const rawBase64 = reader.result.split(',')[1] || reader.result;
            try {
              const parsed = await aiApi.parseVoice(rawBase64);
              const payload = buildPayload(parsed);
              if (!payload) {
                throw new Error('Could not parse voice input.');
              }
              await onTransactionAdded(payload);
              onClose();
            } catch (e) {
              console.error(e);
              setLocalError('Voice input failed. Try again.');
              setMode('idle');
            }
          }
        };

        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setMode('voice');
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const isBusy = isSubmitting || mode === 'processing';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8"
          >
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] shadow-float dark:shadow-2xl dark:shadow-black/50 p-6 w-full max-w-md mx-auto overflow-hidden relative">

              {/* Header / Close */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mode === 'idle' && (transactionType === TransactionType.EXPENSE ? "What did you spend?" : "What did you earn?")}
                  {mode === 'text' && "Type it out"}
                  {mode === 'voice' && "Listening..."}
                  {mode === 'processing' && "Thinking..."}
                </h3>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-full hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors">
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Segmented Control for Type */}
              {mode === 'idle' && (
                <div className="flex bg-gray-100 dark:bg-[#2C2C2E] p-1 rounded-xl mb-6 relative">
                  <motion.div
                    layoutId="activeType"
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm ${transactionType === TransactionType.EXPENSE ? 'bg-white dark:bg-[#3A3A3C] left-1' : 'bg-white dark:bg-[#3A3A3C] right-1'}`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                  <button
                    onClick={() => setTransactionType(TransactionType.EXPENSE)}
                    className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${transactionType === TransactionType.EXPENSE ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => setTransactionType(TransactionType.INCOME)}
                    className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${transactionType === TransactionType.INCOME ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Income
                  </button>
                </div>
              )}

              <div className="min-h-[120px] flex flex-col items-center justify-center relative">

                {/* IDLE STATE */}
                {mode === 'idle' && (
                  <div className="flex gap-6">
                    <button
                      onClick={() => setMode('text')}
                      disabled={isBusy}
                      className="flex flex-col items-center gap-3 group disabled:opacity-50"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-100 dark:border-[#3A3A3C] flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-all shadow-sm">
                        <Keyboard className="text-gray-600 dark:text-gray-300" size={28} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Type</span>
                    </button>

                    <button
                      onClick={startRecording}
                      disabled={isBusy}
                      className="flex flex-col items-center gap-3 group disabled:opacity-50"
                    >
                      <div className={`w-16 h-16 rounded-full border flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-all shadow-sm ${transactionType === TransactionType.EXPENSE ? 'bg-[#FF3B30]/10 border-[#FF3B30]/20' : 'bg-[#34C759]/10 border-[#34C759]/20'}`}>
                        <Mic className={transactionType === TransactionType.EXPENSE ? "text-[#FF3B30]" : "text-[#34C759]"} size={28} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Speak</span>
                    </button>
                  </div>
                )}

                {/* TEXT STATE */}
                {mode === 'text' && (
                  <div className="w-full relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                      placeholder="e.g., 50 egp for coffee"
                      disabled={isBusy}
                      className="w-full text-lg px-4 py-4 bg-gray-50 dark:bg-[#2C2C2E] dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-accent-blue/20 focus:bg-white dark:focus:bg-[#3A3A3C] transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-60"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim() || isBusy}
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-accent-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                )}

                {/* VOICE STATE */}
                {mode === 'voice' && (
                  <div className="flex flex-col items-center w-full">
                    <div className={`w-full h-24 bg-gradient-to-r rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden ${transactionType === TransactionType.EXPENSE ? 'from-orange-50 dark:from-orange-500/10 to-pink-50 dark:to-pink-500/10' : 'from-green-50 dark:from-green-500/10 to-emerald-50 dark:to-emerald-500/10'}`}>
                      {/* Animated Waveform Placeholder */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`absolute inset-0 bg-gradient-to-r blur-xl ${transactionType === TransactionType.EXPENSE ? 'from-orange-400/10 to-pink-500/10' : 'from-green-400/10 to-emerald-500/10'}`}
                      />
                      <div className="flex gap-1 items-center z-10">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [10, 25, 10] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                            className={`w-1.5 bg-gradient-to-t rounded-full ${transactionType === TransactionType.EXPENSE ? 'from-orange-400 to-pink-500' : 'from-green-400 to-emerald-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={stopRecording}
                      disabled={isBusy}
                      className="px-6 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors shadow-sm disabled:opacity-60"
                    >
                      Stop Recording
                    </button>
                  </div>
                )}

                {/* PROCESSING STATE */}
                {(mode === 'processing' || isSubmitting) && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-100 dark:border-[#3A3A3C] border-t-accent-blue animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Making magic happen...</p>
                  </div>
                )}

                {(localError || submitError) && (
                  <p className="text-sm text-red-500 text-center mt-4 px-4">
                    {localError || submitError}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SmartInputSheet;

