import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Search, 
  FileCode, 
  FolderTree, 
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { ALL_MQL5_FILES, generateMQL5Zip } from '../mql5';
import { MQL5File } from '../types';

export const CodeHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<MQL5File>(ALL_MQL5_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredFiles = ALL_MQL5_FILES.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || file.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const zipBlob = await generateMQL5Zip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SyntheticLiquidityScalper_MT5_Package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[760px] relative">
      
      {/* Top Code Hub Bar */}
      <div className="bg-[#050811]/90 border-b border-white/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Code2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight">MQL5 Source Code Suite</h2>
              <p className="text-xs text-slate-400">16 Modular .mq5 and .mqh components ready for MetaEditor compilation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="codehub-download-zip-btn"
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{downloadingZip ? 'Generating Zip...' : 'Download Full MT5 Zip (All Files)'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: File Explorer Sidebar & Code Viewer */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: File Tree & Category Filter */}
        <div className="w-full md:w-80 bg-[#050811]/95 border-r border-white/[0.08] flex flex-col p-3 gap-2.5 overflow-hidden">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="Search MQL5 modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {['All', 'Expert', 'Core', 'Engine', 'Management', 'UI', 'Analytics'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredFiles.map((file) => (
              <button
                key={file.name}
                id={`file-item-${file.name}`}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 ${
                  selectedFile.name === file.name
                    ? 'bg-white/[0.08] border border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <FileCode className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  selectedFile.name === file.name ? 'text-cyan-400' : 'text-slate-500'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold truncate">{file.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-white/[0.06]">
                      {file.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{file.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Directory Summary Notice */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.06] text-[10px] font-mono text-slate-400">
            <span className="text-slate-300 font-bold block mb-0.5">📂 MQL5 Directory Structure:</span>
            <span>• Experts/SyntheticLiquidityScalper.mq5</span>
            <span className="block">• Include/SyntheticScalper/*.mqh (15 files)</span>
          </div>

        </div>

        {/* Right Pane: Code Viewer */}
        <div className="flex-1 flex flex-col bg-[#020612] overflow-hidden">
          
          {/* File Header Details */}
          <div className="bg-[#080d1a] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200">{selectedFile.name}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/[0.08]">
                Path: MQL5/{selectedFile.path}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-code-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-white/[0.08] transition-colors"
                title="Copy entire code to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                id="download-single-btn"
                onClick={handleDownloadSingle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-white/[0.08] transition-colors"
                title="Download this single file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="bg-slate-900/40 px-4 py-2 text-xs font-mono text-cyan-300/90 border-b border-white/[0.06] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{selectedFile.description}</span>
          </div>

          {/* Syntax Highlighted Code Box */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar bg-[#020612]">
            <pre className="selection:bg-cyan-500/30 selection:text-cyan-200">
              <code>{selectedFile.code}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
