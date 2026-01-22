import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Zap, Layers, ArrowRight, Github } from 'lucide-react';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/50 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-display font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
                >
                    AutoMark
                </motion.div>

                <div className="hidden md:flex gap-8">
                    {['Features', 'How it Works', 'Pricing'].map((item, i) => (
                        <motion.a
                            key={item}
                            href={`#${item.toLowerCase().replace(' ', '-')}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-gray-300 hover:text-white transition-colors relative group"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
                        </motion.a>
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-all"
                >
                    Get Started
                </motion.button>
            </div>
        </nav>
    );
};

const Hero = () => {
    return (
        <section className="min-h-screen relative flex items-center justify-center overflow-hidden pt-20">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black z-0 pointer-events-none" />

            {/* Floating Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
                />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">New: SAM 2.1 Large Integration</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-6xl md:text-8xl font-display font-bold mb-6 tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
                >
                    Label at the speed <br /> of <span className="text-blue-500">thought</span>.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Experience pixel-perfect automated segmentation powered by the world's most advanced AI models. Train your data 10x faster.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col md:flex-row gap-4 justify-center items-center"
                >
                    <button className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 group transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                        Start Annotating <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center gap-2 transition-all backdrop-blur-sm">
                        <Github className="w-4 h-4" /> View on GitHub
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

const BentoGrid = () => (
    <section className="py-20 bg-black/50">
        <div className="container mx-auto px-6">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <div className="p-8 rounded-3xl bg-surface border border-white/5 hover:border-blue-500/30 transition-colors col-span-2 row-span-2 group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Lightning Fast Processing</h3>
                    <p className="text-gray-400 mb-6">Powered by SAM 2.1 Large and optimized CUDA kernels, AutoMark processes complex scenes in milliseconds. Drag, drop, done.</p>
                    <div className="w-full h-48 rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/5 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                        {/* Abstract UI representation */}
                        <div className="w-3/4 h-3/4 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md" />
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-surface border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                        <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Smart Layers</h3>
                    <p className="text-gray-400 text-sm">Automatic segmentation of nested objects with perfect edge detection.</p>
                </div>

                <div className="p-8 rounded-3xl bg-surface border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Automated Labels</h3>
                    <p className="text-gray-400 text-sm">Intelligent class name extraction from file metadata.</p>
                </div>
            </motion.div>
        </div>
    </section>
);

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-blue-500/30">
            <Navbar />
            <Hero />
            <BentoGrid />

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-black">
                <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
                    <p>© 2026 AutoMark. Built by Kunj.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
