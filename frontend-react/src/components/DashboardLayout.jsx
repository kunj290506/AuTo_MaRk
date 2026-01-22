import React from 'react';
import { Sidebar } from './Sidebar';

const DashboardLayout = ({ children, activeTab, onTabChange }) => {
    return (
        <div className="min-h-screen bg-background text-text-primary font-sans flex overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

            {/* Main Content Area - with slight offset for floating sidebar effect */}
            <main className="flex-1 ml-72 p-10 h-screen overflow-y-auto">
                <div className="max-w-[1400px] mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
