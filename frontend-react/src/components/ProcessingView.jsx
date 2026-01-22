import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Timer, Zap } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

export const ProcessingView = ({ sessionId, onComplete }) => {
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState('initializing');

    useEffect(() => {
        let interval;
        if (sessionId) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get(`http://localhost:8000/api/progress/${sessionId}`);
                    setProgress(res.data);

                    if (res.data.total > 0) {
                        setStatus('processing');
                        if (res.data.current === res.data.total) {
                            setStatus('complete');
                            clearInterval(interval);
                            setTimeout(() => onComplete(), 1000);
                        }
                    }
                } catch (err) {
                    console.error("Progress error", err);
                    clearInterval(interval);
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [sessionId, onComplete]);

    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    // Circular progress calculation
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
                {/* Left: Visualizer */}
                <div className="relative flex items-center justify-center">
                    {/* Glowing Background */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />

                    <div className="relative w-80 h-80">
                        {/* SVG Ring */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="160" cy="160" r={radius}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="12"
                                fill="transparent"
                            />
                            <circle
                                cx="160" cy="160" r={radius}
                                stroke="#0071e3"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-500 ease-out"
                            />
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-6xl font-display font-bold tracking-tighter">{percentage}%</span>
                            <span className="text-sm font-medium text-blue-400 uppercase tracking-widest mt-2">{status}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats & Logs */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-display font-semibold mb-2">Analyzing Imagery</h2>
                        <p className="text-text-secondary text-lg">SAM 2.1 is segmenting objects with pixel-perfect accuracy.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl glass flex flex-col items-start gap-2">
                            <Clock className="w-6 h-6 text-text-tertiary" />
                            <span className="text-2xl font-mono font-medium">{progress.elapsed ? progress.elapsed.toFixed(1) : 0}s</span>
                            <span className="text-xs text-text-tertiary uppercase">Elapsed</span>
                        </div>
                        <div className="p-5 rounded-2xl glass flex flex-col items-start gap-2">
                            <Timer className="w-6 h-6 text-text-tertiary" />
                            <span className="text-2xl font-mono font-medium">{progress.eta ? progress.eta.toFixed(1) : 0}s</span>
                            <span className="text-xs text-text-tertiary uppercase">Remaining</span>
                        </div>
                        <div className="p-5 rounded-2xl glass flex flex-col items-start gap-2 col-span-2">
                            <Zap className="w-6 h-6 text-yellow-500" />
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-mono font-medium">{progress.avg_time ? (1 / progress.avg_time).toFixed(1) : 0}</span>
                                <span className="text-sm text-text-tertiary">images / sec</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-text-secondary h-32 overflow-hidden relative">
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" />
                        <p className="text-primary mb-1">Running inference on CUDA device 0...</p>
                        {progress.current > 0 && <p className="mb-1">Batch {progress.current} processed successfully.</p>}
                        {progress.current > 0 && <p className="text-text-tertiary">Latency: {(progress.avg_time * 1000).toFixed(0)}ms per frame</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
