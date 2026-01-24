import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Loader2, Download, X as XIcon } from 'lucide-react';
import { aiApi } from '../../services/api';

const InfographicGenerator: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setError(null);
        setLoading(true);

        try {
            // Generate image using Gemini image model
            const response = await aiApi.generateInfographic();

            if (response && response.image) {
                setImageUrl(response.image);
            } else {
                setError("Failed to generate image. Please try again.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Something went wrong. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!imageUrl && !loading ? (
                    // INITIAL STATE
                    <motion.div
                        key="cta"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-1 overflow-hidden shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
                    >
                        <button
                            onClick={handleGenerate}
                            className="relative w-full bg-white dark:bg-[#1C1C1E] rounded-[1.8rem] p-6 flex items-center justify-between group active:scale-[0.98] transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <ImageIcon size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        Generate Infographic
                                    </h3>
                                    <p className="text-xs font-medium text-gray-400">
                                        Visualize your cash flow
                                    </p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                AI Infographic
                            </div>
                        </button>
                        {error && (
                            <div className="px-6 pb-4 text-xs font-bold text-red-500 text-center">
                                {error}
                            </div>
                        )}
                    </motion.div>
                ) : loading ? (
                    // LOADING STATE
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 text-center shadow-sm border border-gray-100 dark:border-[#2C2C2E] min-h-[170px]"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Drawing your finances...</h3>
                            <p className="text-xs text-gray-400 font-medium">Analyzing data & rendering flow...</p>
                        </div>
                    </motion.div>
                ) : (
                    // RESULT STATE
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white dark:bg-[#1C1C1E] rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 dark:border-[#2C2C2E]"
                    >
                        <div className="relative w-full bg-gray-50 dark:bg-black/50">
                            <img src={imageUrl!} alt="Financial Infographic" className="w-full h-auto object-cover" />
                        </div>

                        <div className="p-5 bg-white dark:bg-[#1C1C1E] flex items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Monthly Flow</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                    AI-generated visualization of your cash flow.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={imageUrl!}
                                    download={`hasala-infographic-${new Date().toISOString().split('T')[0]}.png`}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-[#2C2C2E] rounded-full text-[#1C1C1E] dark:text-white hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors"
                                    title="Download"
                                >
                                    <Download size={18} />
                                </a>
                                <button
                                    onClick={() => setImageUrl(null)}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-[#2C2C2E] rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    title="Close"
                                >
                                    <XIcon size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfographicGenerator;
