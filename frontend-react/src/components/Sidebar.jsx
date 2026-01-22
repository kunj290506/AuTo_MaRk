import React from 'react';
import { Layout, Plus, Settings, Github, Database } from 'lucide-react';

export const Sidebar = ({ activeTab, onTabChange }) => {
    const menuItems = [
        { id: 'new-project', label: 'New Project', icon: Plus },
        { id: 'library', label: 'Library', icon: Database },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="w-72 h-screen flex flex-col fixed left-0 top-0 z-50 glass border-r-0 border-r-white/10">
            {/* Dynamic Background Blur Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl -z-10" />

            {/* Header */}
            <div className="p-6 pt-10 px-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Layout className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-display font-semibold text-xl tracking-tight text-white/90">AutoMark</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${activeTab === item.id
                                ? 'bg-primary text-white shadow-md shadow-blue-900/20 scale-[1.02]'
                                : 'text-text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-text-tertiary'}`} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Status Footer */}
            <div className="p-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(48,209,88,0.6)] animate-pulse" />
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">System Active</span>
                    </div>
                    <p className="text-xs text-text-tertiary font-medium">SAM 2.1 Large</p>
                </div>
            </div>
        </div>
    );
};
