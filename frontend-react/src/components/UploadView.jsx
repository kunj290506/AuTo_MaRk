import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UploadView = ({ files, setFiles, onProcess }) => {
    const onDrop = useCallback(acceptedFiles => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-10 max-w-5xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-display font-semibold tracking-tight text-white mb-2">New Project</h2>
                    <p className="text-lg text-text-secondary">Drag and drop to begin annotation.</p>
                </div>
                {files.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onProcess}
                        className="px-6 py-3 bg-primary hover:bg-primaryHover text-white rounded-full font-medium transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                    >
                        Start Processing
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            <div
                {...getRootProps()}
                className={`relative group rounded-3xl h-80 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${isDragActive
                        ? 'glass bg-blue-500/10 border-primary/50 scale-[1.01]'
                        : 'glass hover:bg-white/5 border-white/5 hover:border-white/10'
                    }`}
            >
                <input {...getInputProps()} />
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragActive ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary group-hover:bg-white/10 group-hover:text-white'
                    }`}>
                    <UploadCloud className="w-10 h-10" />
                </div>
                <p className="text-2xl font-medium text-white mb-2">
                    {isDragActive ? 'Drop to Add' : 'Drop images or ZIPs'}
                </p>
                <p className="text-base text-text-tertiary">High-Res JPG, PNG, Archives</p>
            </div>

            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">File Queue</h3>
                        <span className="text-sm text-text-tertiary">{files.length} items</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {files.map((file, i) => (
                                <motion.div
                                    key={`${file.name}-${i}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/5 transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-blue-400">
                                        {file.name.endsWith('.zip') ? (
                                            <div className="font-bold text-yellow-500 text-xs">ZIP</div>
                                        ) : (
                                            <File className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-medium text-white truncate mb-0.5">{file.name}</p>
                                        <p className="text-xs text-text-tertiary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-destructive text-text-tertiary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};
