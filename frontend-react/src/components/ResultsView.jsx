import React from 'react';
import { Download, ArrowLeft, Image as ImageIcon, Share } from 'lucide-react';
import { motion } from 'framer-motion';

export const ResultsView = ({ results, sessionId, onReset }) => {
    const downloadUrl = `http://localhost:8000/api/download/${sessionId}`;

    return (
        <div className="space-y-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end sticky top-0 z-20 pb-4 bg-background/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onReset}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white">Generation Complete</h2>
                        <p className="text-text-secondary">Ready for export.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right mr-4 hidden md:block">
                        <p className="text-lg font-bold text-white leading-none">{results.total_images}</p>
                        <p className="text-xs text-text-tertiary uppercase tracking-wider">Images</p>
                    </div>
                    <div className="text-right mr-6 hidden md:block">
                        <p className="text-lg font-bold text-white leading-none">{results.total_detections}</p>
                        <p className="text-xs text-text-tertiary uppercase tracking-wider">Labels</p>
                    </div>

                    <a
                        href={downloadUrl}
                        className="px-6 py-3 bg-success hover:bg-green-500 text-white rounded-full font-medium transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download Dataset
                    </a>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-12">
                {results.processed_files.map((file, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-surface/50 border border-white/5 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                        <img
                            src={`http://localhost:8000/output/${sessionId}/annotated/${file.filename}`}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-white backdrop-blur-md">{file.detections} Labels</span>
                                </div>
                                <p className="text-sm font-medium text-white/90 truncate">{file.filename}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
