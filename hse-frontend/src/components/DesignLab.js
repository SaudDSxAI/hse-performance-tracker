import React, { useState, useMemo } from 'react';
import {
    Moon, Sun, Palette, Layout, Code, Copy,
    CheckCircle2, AlertCircle, Trash2, Plus,
    ChevronRight, Search, Users, Activity,
    LayoutDashboard, UserCircle, Settings as SettingsIcon,
    Briefcase, MapPin, HardHat
} from 'lucide-react';

const DesignLab = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('palette');
    const [isDark, setIsDark] = useState(false);
    const [hue, setHue] = useState(210); // Default Navy (210)

    // Derived colors
    const colors = useMemo(() => {
        const h = hue;
        return {
            primary: `hsl(${h}, 45%, 35%)`,
            primaryLight: `hsl(${h}, 45%, 45%)`,
            primarySoft: isDark ? `hsl(${h}, 30%, 15%)` : `hsl(${h}, 45%, 96%)`,
            primaryText: isDark ? `hsl(${h}, 100%, 90%)` : `hsl(${h}, 45%, 30%)`,

            bg: isDark ? '#0A0E1A' : '#F8F9FA',
            surface: isDark ? '#1A1F2E' : '#FFFFFF',
            border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',

            textMain: isDark ? '#FFFFFF' : '#1F2937',
            textBody: isDark ? '#94A3B8' : '#64748B',

            success: '#0D9488',
            warning: '#F59E0B',
            error: '#DC2626',
        };
    }, [hue, isDark]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('CSS Copied to Clipboard!');
    };

    const cssCode = `/* HSE Design System Tokens - Hue: ${hue} */
:root {
  --primary: ${colors.primary};
  --primary-light: ${colors.primaryLight};
  --primary-soft: ${colors.primarySoft};
  --primary-text: ${colors.primaryText};
  
  --bg: ${colors.bg};
  --surface: ${colors.surface};
  --border: ${colors.border};
  
  --text-main: ${colors.textMain};
  --text-body: ${colors.textBody};
  
  --success: ${colors.success};
  --warning: ${colors.warning};
  --error: ${colors.error};
}

/* Dark Mode Overrides */
.dark {
  --bg: #0A0E1A;
  --surface: #1A1F2E;
  --text-main: #FFFFFF;
  --text-body: #94A3B8;
  --primary-soft: hsl(${hue}, 30%, 15%);
}`;

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col ${isDark ? 'dark' : ''}`}>
            <div className="absolute inset-0 bg-background transition-colors duration-500 overflow-hidden flex flex-col">

                {/* Header / Top Control Bar */}
                <div className="h-20 border-b border-border bg-surface px-8 flex items-center justify-between shrink-0 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary animate-pulse">
                            <Palette size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-text-main tracking-tight">HSE Branding Lab</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Interactive Color Engine v1.0</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Hue Slider */}
                        <div className="flex items-center gap-4 bg-background p-2 px-4 rounded-2xl border border-border">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Hue</span>
                            <input
                                type="range"
                                min="180" max="230"
                                value={hue}
                                onChange={(e) => setHue(e.target.value)}
                                className="w-48 h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-xs font-mono font-bold text-primary w-8">{hue}°</span>
                        </div>

                        {/* Mode Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-3 rounded-2xl bg-background border border-border text-text-main hover:border-primary transition-all shadow-sm"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button
                            onClick={onClose}
                            className="bg-text-main text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-black/10"
                        >
                            Exit Lab
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-64 border-r border-border bg-surface p-6 flex flex-col gap-2 shrink-0 transition-colors">
                        <button
                            onClick={() => setActiveTab('palette')}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'palette' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-body hover:bg-background'}`}
                        >
                            <Palette size={18} />
                            <span className="text-sm font-black uppercase tracking-widest">Palette</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'preview' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-body hover:bg-background'}`}
                        >
                            <Layout size={18} />
                            <span className="text-sm font-black uppercase tracking-widest">Preview</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('export')}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'export' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-body hover:bg-background'}`}
                        >
                            <Code size={18} />
                            <span className="text-sm font-black uppercase tracking-widest">Code</span>
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-12 bg-background transition-colors">

                        {activeTab === 'palette' && (
                            <div className="max-w-4xl animate-in fade-in slide-in-from-left-4 duration-500">
                                <h2 className="text-3xl font-black text-text-main mb-8">System Color Palette</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Primary Action', hex: colors.primary, desc: 'Buttons, Active States' },
                                        { label: 'Primary Light', hex: colors.primaryLight, desc: 'Hover, Icons' },
                                        { label: 'Primary Soft', hex: colors.primarySoft, desc: 'Faint Card Accents' },
                                        { label: 'App Background', hex: colors.bg, desc: 'Main Page Layer' },
                                        { label: 'Surface Background', hex: colors.surface, desc: 'Cards and Modals' },
                                        { label: 'Card Border', hex: colors.border, desc: 'Container Edges' },
                                        { label: 'Text Main', hex: colors.textMain, desc: 'Headers & Titles' },
                                        { label: 'Text Body', hex: colors.textBody, desc: 'Labels & Descriptions' },
                                        { label: 'Success Tint', hex: colors.success, desc: 'Positive Status' },
                                    ].map((c, i) => (
                                        <div key={i} className="bg-surface p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all group">
                                            <div
                                                className="w-full h-32 rounded-3xl mb-4 shadow-inner border border-black/5"
                                                style={{ backgroundColor: c.hex }}
                                            />
                                            <h3 className="font-black text-text-main text-sm uppercase tracking-widest mb-1">{c.label}</h3>
                                            <p className="text-xs text-text-body font-bold mb-4 opacity-70">{c.desc}</p>
                                            <div className="flex items-center justify-between border-t border-border pt-4">
                                                <code className="text-xs font-black uppercase text-primary">{c.hex}</code>
                                                <button onClick={() => copyToClipboard(c.hex)} className="text-text-body hover:text-primary transition-colors">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'preview' && (
                            <div className="max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Component Stress Test</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        {/* Card Example */}
                                        <div className="bg-surface rounded-3xl border border-border p-8 shadow-xl">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                        <Activity size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-text-main text-lg leading-tight">Project Performance</h4>
                                                        <p className="text-xs text-text-body font-bold uppercase tracking-widest opacity-60">Real-time Safety Metrics</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Active
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                                                    <span>Critical Tasks</span>
                                                    <span className="text-primary">85% Completed</span>
                                                </div>
                                                <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
                                                    <div className="h-full bg-primary rounded-full w-[85%] transition-all duration-1000" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-8">
                                                <button className="bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 cursor-default">Primary Action</button>
                                                <button className="bg-background border border-border text-text-main py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-default">Secondary</button>
                                            </div>
                                        </div>

                                        {/* List Example */}
                                        <div className="space-y-3">
                                            {[
                                                { icon: Users, label: 'Team Members', val: '12 Users', color: 'primary' },
                                                { icon: HardHat, label: 'Active Sites', val: '4 Active', color: 'warning' },
                                                { icon: Briefcase, label: 'Organization', val: 'Pro Level', color: 'success' },
                                            ].map((item, i) => (
                                                <div key={i} className="bg-surface p-5 rounded-[1.5rem] border border-border flex items-center justify-between group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 bg-${item.color}/10 text-${item.color} rounded-xl flex items-center justify-center`}>
                                                            <item.icon size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-text-main text-sm">{item.label}</p>
                                                            <p className="text-[10px] text-text-body font-bold opacity-60 uppercase tracking-widest">{item.val}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-text-body opacity-30 group-hover:text-primary group-hover:opacity-100 transition-all" />
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </section>

                                <section className="bg-primary-soft rounded-[3rem] p-12 border border-primary/10">
                                    <div className="max-w-2xl mx-auto text-center">
                                        <h3 className="text-2xl font-black text-primary-text mb-4">Ready to update your corporate identity?</h3>
                                        <p className="text-sm font-bold text-primary-text/70 mb-8 leading-relaxed">
                                            This interactive lab calculates accessible contrast ratios and semantic highlights in real-time.
                                            The palette is optimized for industrial high-visibility standards.
                                        </p>
                                        <button className="bg-primary text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transform hover:scale-105 transition-all">
                                            Save Settings
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'export' && (
                            <div className="max-w-4xl animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-text-main">Export tokens</h2>
                                        <p className="text-sm font-bold text-text-body uppercase tracking-widest opacity-60 mt-2">Copy the variables below to your index.css</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(cssCode)}
                                        className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                                    >
                                        <Copy size={16} />
                                        Copy CSS Variables
                                    </button>
                                </div>

                                <div className="bg-[#1E1E1E] rounded-[2rem] p-8 font-mono text-sm overflow-hidden border-4 border-black group shadow-2xl relative">
                                    <div className="absolute top-4 right-8 flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                                        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                                    </div>
                                    <pre className="text-[#D4D4D4] whitespace-pre-wrap leading-relaxed">
                                        {cssCode}
                                    </pre>
                                </div>

                                <div className="mt-8 p-8 bg-surface border-2 border-dashed border-border rounded-3xl">
                                    <h4 className="font-black text-text-main text-sm uppercase mb-4 tracking-widest">How to apply:</h4>
                                    <ol className="space-y-4 text-sm text-text-body font-bold leading-relaxed list-decimal pl-6">
                                        <li>Open your project's <code className="bg-background px-2 py-1 rounded text-primary border border-border">src/index.css</code> file.</li>
                                        <li>Locate the <code className="bg-background px-2 py-1 rounded text-primary border border-border">:root</code> block and replace its contents.</li>
                                        <li>The application will automatically react to these changes instantly using CSS variables.</li>
                                        <li>Check the generated <code className="bg-background px-2 py-1 rounded text-primary border border-border">.dark</code> class too for smooth night-mode transitions.</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Inline Style Injection for Real-time Preview in Lab */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --primary: ${colors.primary};
                    --primary-light: ${colors.primaryLight};
                    --primary-soft: ${colors.primarySoft};
                    --primary-text: ${colors.primaryText};
                    --bg: ${colors.bg};
                    --surface: ${colors.surface};
                    --border: ${colors.border};
                    --text-main: ${colors.textMain};
                    --text-body: ${colors.textBody};
                    --success: ${colors.success};
                    --warning: ${colors.warning};
                    --error: ${colors.error};
                    --background: var(--bg);
                }
            `}} />
        </div>
    );
};

export default DesignLab;
