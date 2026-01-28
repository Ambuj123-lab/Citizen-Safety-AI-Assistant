import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ activeTab, onTabChange }) => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [kbExpanded, setKbExpanded] = useState(true);

    const menuItems = [
        { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
        { id: 'knowledge', icon: '📚', label: 'Knowledge Base', expandable: true },
        { id: 'history', icon: '💬', label: 'Chat History' },
        { id: 'analytics', icon: '📊', label: 'Analytics' },
        { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    const kbTopics = [
        { id: 'digital-arrest', label: 'Digital Arrest Scams' },
        { id: 'banking', label: 'Banking & UPI Fraud' },
        { id: 'job-scams', label: 'Fake Job SMS Scams' },
        { id: 'posh', label: 'Women Safety (POSH Act)' },
        { id: 'pocso', label: 'Child Protection (POCSO)' },
        { id: 'ombudsman', label: 'Banking Ombudsman' },
    ];

    return (
        <aside className={`w-64 h-screen fixed left-0 top-0 border-r transition-colors
            ${isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-200'}`}>

            {/* Logo */}
            <div className={`p-4 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg shadow-lg">
                        🛡️
                    </div>
                    <div>
                        <h1 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Citizen Safety AI</h1>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>by Ambuj Kumar Tripathi</p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <nav className="p-3 space-y-1">
                {menuItems.map(item => (
                    <div key={item.id}>
                        <button
                            onClick={() => {
                                if (item.expandable) {
                                    setKbExpanded(!kbExpanded);
                                } else {
                                    onTabChange(item.id);
                                }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm
                                ${activeTab === item.id
                                    ? isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
                                    : isDark ? 'text-slate-400 hover:bg-[#111] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                            {item.expandable && (
                                <span className={`transition-transform ${kbExpanded ? 'rotate-180' : ''}`}>▾</span>
                            )}
                        </button>

                        {/* Knowledge Base Sub-menu */}
                        {item.expandable && kbExpanded && (
                            <div className="ml-8 mt-1 space-y-1">
                                {kbTopics.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => onTabChange('dashboard', topic.label)}
                                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors
                                            ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-[#111]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {topic.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
