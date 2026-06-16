import { useState } from 'react';
import { useApp, PRESET_THEMES } from '@/context/AppContext';
import { 
  Settings, RefreshCw, Download, Upload, Copy, Trash2, 
  Layout, Type, Sliders, Play, Square, Eye, ShieldCheck, 
  Palette, Grid, CheckCircle, Info, AlertTriangle, XCircle, Heart
} from 'lucide-react';

export default function Appearance() {
  const {
    activeThemeName,
    setActiveThemeName,
    themeConfig,
    setThemeConfig,
    customThemes,
    applyThemeConfig,
    saveCustomTheme,
    deleteCustomTheme,
    duplicateCustomTheme,
    exportTheme,
    importTheme,
    resetTheme,
    addToast
  } = useApp();

  const [newThemeName, setNewThemeName] = useState('');
  const [duplicateNameInput, setDuplicateNameInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [themeToDuplicate, setThemeToDuplicate] = useState('');
  const [themeRole, setThemeRole] = useState('personal'); // organization (super admin), department (admin), personal (user)

  // Color picker labels configuration
  const colorItems = [
    { key: 'primary', label: 'Primary Color', desc: 'Main brand highlights, links, primary buttons' },
    { key: 'secondary', label: 'Secondary Color', desc: 'Secondary highlights, sub-menus' },
    { key: 'accent', label: 'Accent Color', desc: 'Alert badges, graphs gradients, accessory buttons' },
    { key: 'sidebar', label: 'Sidebar Background', desc: 'Fills the left-hand navigation sidebar' },
    { key: 'header', label: 'Navbar/Header Background', desc: 'Fills the top header dashboard bar' },
    { key: 'card', label: 'Card Background', desc: 'Grid cards, modals, dropdown panels' },
    { key: 'background', label: 'App Background', desc: 'Core body background' },
    { key: 'tableHeader', label: 'Table Header Fill', desc: 'Grid/list table column headers background' },
    { key: 'hover', label: 'Hover Background', desc: 'List items, dropdowns and button hover states' },
    { key: 'border', label: 'Border Color', desc: 'Dividers, grid outlines, input wraps' },
    { key: 'link', label: 'Link Text Color', desc: 'Hyperlink anchors and clickable symbols' },
    { key: 'icon', label: 'Icon Color', desc: 'Main navigation and card symbol graphics' },
    { key: 'success', label: 'Success Indicators', desc: 'Active, paid, confirmed status tags' },
    { key: 'warning', label: 'Warning Indicators', desc: 'Pending, low stock status warnings' },
    { key: 'danger', label: 'Error / Danger Indicators', desc: 'Failed, cancelled, out of stock warnings' },
    { key: 'info', label: 'Info Alerts', desc: 'Informational banner highlights' }
  ];

  const handleColorChange = (key, val) => {
    applyThemeConfig({ [key]: val });
    if (activeThemeName !== 'custom-builder') {
      setActiveThemeName('custom-builder');
    }
  };

  const handleSelectPreset = (presetKey) => {
    setThemeConfig(PRESET_THEMES[presetKey]);
    setActiveThemeName(presetKey);
    addToast(`Preset theme "${presetKey.replace('-', ' ')}" applied successfully.`, 'success');
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!newThemeName.trim()) {
      addToast('Please enter a theme name.', 'error');
      return;
    }
    saveCustomTheme(newThemeName, { ...themeConfig });
    setActiveThemeName(newThemeName);
    setShowSaveModal(false);
    setNewThemeName('');
  };

  const handleApplyCustom = (theme) => {
    setThemeConfig(theme.config);
    setActiveThemeName(theme.name);
    addToast(`Custom theme "${theme.name}" applied.`, 'success');
  };

  const handleOpenDuplicate = (themeName) => {
    setThemeToDuplicate(themeName);
    setDuplicateNameInput(`${themeName} (Copy)`);
    setShowDuplicateModal(true);
  };

  const handleConfirmDuplicate = (e) => {
    e.preventDefault();
    if (!duplicateNameInput.trim()) return;
    duplicateCustomTheme(themeToDuplicate, duplicateNameInput);
    setShowDuplicateModal(false);
    setThemeToDuplicate('');
  };

  const handleExport = () => {
    exportTheme(themeConfig);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        importTheme(result);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            <Palette className="text-indigo-500" /> Appearance & Theme Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize global UI style presets, color builders, border radius, layout density, and shadow attributes.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={resetTheme}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> One-Click Reset
          </button>
        </div>
      </div>

      {/* Main Settings Form Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column Settings Fields (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Preset Themes Selector Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider flex items-center gap-1.5">
              <Grid size={14} className="text-indigo-500" /> Professional Design Theme Presets
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.keys(PRESET_THEMES).map((presetKey) => {
                const preset = PRESET_THEMES[presetKey];
                const isActive = activeThemeName === presetKey;
                
                return (
                  <button
                    key={presetKey}
                    onClick={() => handleSelectPreset(presetKey)}
                    className={`p-3.5 border rounded-2xl transition-all cursor-pointer text-left space-y-2 flex flex-col justify-between ${
                      isActive 
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10 ring-1 ring-indigo-500' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold capitalize text-slate-800 dark:text-slate-200 block truncate leading-tight">
                        {presetKey.replace('-', ' ')}
                      </span>
                    </div>
                    {/* Visual Color swatches */}
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: preset.primary }} title="Primary"></span>
                      <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: preset.accent }} title="Accent"></span>
                      <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: preset.sidebar }} title="Sidebar"></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Theme Builder (Colors list color pickers) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-500" /> Custom UX4G Color Palette Editor
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold italic">Adjust picker to build custom colors</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {colorItems.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-850/30 pb-3.5 last:border-0 last:pb-0">
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium block leading-normal">{item.desc}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {themeConfig[item.key] || '#ffffff'}
                    </span>
                    <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                      <input 
                        type="color" 
                        value={themeConfig[item.key] || '#ffffff'}
                        onChange={(e) => handleColorChange(item.key, e.target.value)}
                        className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Layout and density controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-500" /> Custom Layout, Density & Borders
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
              
              {/* Density selector */}
              <div className="space-y-2 border-b border-slate-50 dark:border-slate-850/30 pb-4 md:border-b-0 md:pb-0">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">UI Spacing Density</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  {['compact', 'comfortable', 'wide'].map(densityOpt => (
                    <button
                      key={densityOpt}
                      onClick={() => applyThemeConfig({ density: densityOpt })}
                      className={`py-1.5 rounded-lg text-[10px] capitalize transition-all cursor-pointer ${
                        themeConfig.density === densityOpt 
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {densityOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Base Typography Font Size</label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  {['sm', 'base', 'lg', 'xl'].map(sizeOpt => (
                    <button
                      key={sizeOpt}
                      onClick={() => applyThemeConfig({ fontSize: sizeOpt })}
                      className={`py-1.5 rounded-lg text-[10px] uppercase transition-all cursor-pointer ${
                        themeConfig.fontSize === sizeOpt 
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {sizeOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius Slider */}
              <div className="space-y-2 border-b border-slate-50 dark:border-slate-850/30 pb-4 md:border-b-0 md:pb-0">
                <div className="flex justify-between items-center text-[10px] text-slate-450 uppercase">
                  <span>Border Corner Radius</span>
                  <span className="text-indigo-500 font-mono font-bold">{themeConfig.borderRadius}px</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="32"
                  value={themeConfig.borderRadius}
                  onChange={(e) => applyThemeConfig({ borderRadius: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600 dark:accent-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Sidebar Width Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-450 uppercase">
                  <span>Sidebar Navigation Width</span>
                  <span className="text-indigo-500 font-mono font-bold">{themeConfig.sidebarWidth}px</span>
                </div>
                <input 
                  type="range"
                  min="200"
                  max="320"
                  value={themeConfig.sidebarWidth}
                  onChange={(e) => applyThemeConfig({ sidebarWidth: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600 dark:accent-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Font Family Selection */}
              <div className="space-y-2 border-b border-slate-50 dark:border-slate-850/30 pb-4 md:border-b-0 md:pb-0">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Font Family</label>
                <select 
                  value={themeConfig.fontFamily}
                  onChange={(e) => applyThemeConfig({ fontFamily: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="Inter">Inter (SaaS standard)</option>
                  <option value="Roboto">Roboto (Technical clean)</option>
                  <option value="Outfit">Outfit (Brand premium)</option>
                  <option value="system-ui">System Default (High performance)</option>
                </select>
              </div>

              {/* Card Shadow Intensity */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Card Shadow Intensity</label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  {['none', 'light', 'medium', 'high'].map(shadowOpt => (
                    <button
                      key={shadowOpt}
                      onClick={() => applyThemeConfig({ shadowIntensity: shadowOpt })}
                      className={`py-1.5 rounded-lg text-[10px] capitalize transition-all cursor-pointer ${
                        themeConfig.shadowIntensity === shadowOpt 
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {shadowOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation toggler */}
              <div className="space-y-2 col-span-1 md:col-span-2 pt-2 flex items-center justify-between border-t border-slate-50 dark:border-slate-850/30">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Enable Interface Transitions & Keyframes</span>
                  <span className="text-[10px] text-slate-400 font-medium block">Toggles sliding cards and fade-in transitions. Disabling improves legacy device render performance.</span>
                </div>
                <button
                  onClick={() => applyThemeConfig({ animationsEnabled: !themeConfig.animationsEnabled })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors relative cursor-pointer outline-none ${
                    themeConfig.animationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`block w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm ${
                    themeConfig.animationsEnabled ? 'translate-x-5.5' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>

            </div>
          </div>

          {/* Role Based Theme Scope Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-500" /> Organization Theme Policy (Role-based)
            </h3>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { key: 'personal', label: 'Personal Override', desc: 'Saves theme as local personal profile preference' },
                  { key: 'department', label: 'Department Scope', desc: 'Allows Admin to save theme for entire Marketing/Sales groups' },
                  { key: 'organization', label: 'Organization Default', desc: 'Super Admin: Force default appearance across all active tenants' }
                ].map((roleOpt) => (
                  <button
                    key={roleOpt.key}
                    onClick={() => {
                      setThemeRole(roleOpt.key);
                      addToast(`Scoped theme management role: ${roleOpt.label}`, 'info');
                    }}
                    className={`p-3 border rounded-xl transition-all cursor-pointer text-left space-y-1 ${
                      themeRole === roleOpt.key
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/5'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-slate-800 dark:text-slate-200 font-bold block">{roleOpt.label}</span>
                    <span className="text-[9px] text-slate-400 font-medium block leading-normal">{roleOpt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Theme list and operations */}
          {customThemes.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider">Your Saved Custom Themes</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customThemes.map((theme) => {
                  const isActive = activeThemeName === theme.name;
                  return (
                    <div 
                      key={theme.name}
                      className={`p-3 border rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        isActive 
                          ? 'border-indigo-500 bg-indigo-50/5 ring-1 ring-indigo-500' 
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => handleApplyCustom(theme)}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{theme.name}</span>
                        <div className="flex gap-1 mt-1.5">
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.config.primary }}></span>
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.config.accent }}></span>
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.config.sidebar }}></span>
                        </div>
                      </button>
                      
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenDuplicate(theme.name)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Duplicate Theme"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => deleteCustomTheme(theme.name)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Delete Theme"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Import / Export Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs font-bold">
            <div>
              <h4 className="text-slate-850 dark:text-slate-100">Export & Share UI Configurations</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Export custom setup as JSON files or import themes created by other organization members.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                <Download size={13} /> Export Theme
              </button>
              
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer">
                <Upload size={13} /> Import JSON
                <input 
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Live Preview Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5 sticky top-24">
            <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Eye size={14} className="text-indigo-500 animate-pulse" /> Centralized Live Preview Panel
            </h3>

            {/* Simulated Live preview dashboard mock widget */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-4 space-y-4 text-xs font-bold overflow-hidden select-none pointer-events-none">
              
              {/* Mock Topbar Header */}
              <div 
                className="p-3 rounded-xl flex items-center justify-between text-[10px] border border-slate-200/50"
                style={{ backgroundColor: themeConfig.header }}
              >
                <span className="text-white font-extrabold flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-indigo-500"></span> AIO CRM
                </span>
                <span className="text-white/80 font-medium">Search Palette...</span>
              </div>

              <div className="grid grid-cols-12 gap-3.5">
                
                {/* Mock Sidebar Left (4 cols) */}
                <div 
                  className="col-span-4 p-2.5 rounded-xl border border-slate-200/50 space-y-2"
                  style={{ backgroundColor: themeConfig.sidebar }}
                >
                  <div className="w-full h-1.5 bg-slate-350 rounded"></div>
                  
                  {/* Active Sidebar item mockup */}
                  <div 
                    className="p-1 rounded text-[7px] font-extrabold text-white flex items-center gap-1"
                    style={{ backgroundColor: themeConfig.primary }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span> Active
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-300 rounded"></div>
                </div>

                {/* Mock Dashboard Area Right (8 cols) */}
                <div className="col-span-8 space-y-3">
                  
                  {/* Mock Card */}
                  <div 
                    className="p-3 border rounded-xl space-y-2 text-[8px]"
                    style={{ 
                      backgroundColor: themeConfig.card,
                      borderColor: themeConfig.border,
                      boxShadow: themeConfig.shadowIntensity === 'none' ? 'none' : themeConfig.shadowIntensity === 'medium' ? '0 4px 12px rgba(0,0,0,0.06)' : '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span className="text-slate-400 block font-semibold">Mock Analytics Card</span>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-extrabold" style={{ color: themeConfig.primary }}>₹45,900</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: themeConfig.success }}>+12%</span>
                    </div>
                  </div>

                  {/* Mock Buttons and Actions */}
                  <div className="flex gap-2.5">
                    <button 
                      className="flex-1 py-1.5 rounded-lg text-[8px] font-extrabold text-white"
                      style={{ backgroundColor: themeConfig.primary }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className="flex-1 py-1.5 rounded-lg text-[8px] font-extrabold border"
                      style={{ 
                        borderColor: themeConfig.border, 
                        color: themeConfig.primary,
                        backgroundColor: themeConfig.card 
                      }}
                    >
                      Secondary
                    </button>
                  </div>

                </div>

              </div>

              {/* Mock Table Header and rows */}
              <div className="border border-slate-200/50 rounded-xl overflow-hidden">
                <div 
                  className="p-2 text-[7px] text-slate-500 font-extrabold uppercase tracking-wider"
                  style={{ backgroundColor: themeConfig.tableHeader }}
                >
                  Table Header row
                </div>
                <div className="p-2 bg-white dark:bg-[#1E293B] border-t border-slate-100 dark:border-slate-800 text-[8px]">
                  Fulfillment Row item
                </div>
              </div>

              {/* Mock Indicator colors */}
              <div className="grid grid-cols-4 gap-2 text-[8px] text-center text-white">
                <div className="p-1 rounded" style={{ backgroundColor: themeConfig.success }}>Success</div>
                <div className="p-1 rounded" style={{ backgroundColor: themeConfig.warning }}>Warning</div>
                <div className="p-1 rounded" style={{ backgroundColor: themeConfig.danger }}>Danger</div>
                <div className="p-1 rounded text-slate-800" style={{ backgroundColor: themeConfig.info }}>Info</div>
              </div>

            </div>

            <div className="p-4 bg-indigo-50/5 dark:bg-indigo-950/5 border border-indigo-100/50 dark:border-indigo-950 rounded-2xl text-[11px] font-bold text-slate-550 space-y-2.5">
              <h4 className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-xs">
                <Info size={14} /> Design Token Audit
              </h4>
              <p className="font-semibold leading-relaxed">
                Updating tokens above triggers dynamic injection of styles. All active CRM modules (E-Commerce, Omnichannel Hub, Support, Admin Settings) will adapt reactively.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Save Custom Theme Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleSaveCustom} className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Palette size={16} className="text-indigo-505" /> Save Custom Theme Profile
              </h3>
              <button type="button" onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={16} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Theme Name *</label>
                <input 
                  type="text" 
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  required
                  placeholder="e.g. Sales Team Theme"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Save Theme Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Duplicate Custom Theme Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleConfirmDuplicate} className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Copy size={16} className="text-indigo-505" /> Duplicate Theme Profile
              </h3>
              <button type="button" onClick={() => setShowDuplicateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={16} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">New Theme Name *</label>
                <input 
                  type="text" 
                  value={duplicateNameInput}
                  onChange={e => setDuplicateNameInput(e.target.value)}
                  required
                  placeholder="e.g. Sales Team Theme (Copy)"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Confirm Duplicate
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
