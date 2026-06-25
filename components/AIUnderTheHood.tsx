import React, { useState, useEffect } from 'react';
import { Brain, Code, Database, Zap, X, ChevronRight, ChevronDown } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: any; // The data being processed (e.g., Partner Data, Opportunity Data)
    type: 'embedding' | 'matching' | 'generation';
    score?: number;
}

const AIUnderTheHood: React.FC<Props> = ({ isOpen, onClose, data, type, score }) => {
    const [activeTab, setActiveTab] = useState<'json' | 'vector' | 'logic'>('logic');
    const [simulatedVectors, setSimulatedVectors] = useState<number[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Generate random "vector" data for visualization
            setSimulatedVectors(Array.from({ length: 50 }, () => Math.random()));
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    return (
        <div className="fixed top-20 right-6 w-96 bg-slate-900/95 backdrop-blur-xl text-slate-300 rounded-2xl shadow-2xl border border-slate-700 z-[9999] overflow-hidden animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                        <Brain size={18} />
                    </div>
                    <span className="font-bold text-white text-sm uppercase tracking-widest">AI Logic Inspector</span>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                <button 
                    onClick={() => setActiveTab('logic')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors ${activeTab === 'logic' ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-800/50' : 'text-slate-500'}`}
                >
                    Logic Flow
                </button>
                <button 
                    onClick={() => setActiveTab('vector')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors ${activeTab === 'vector' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500'}`}
                >
                    Embeddings
                </button>
                <button 
                    onClick={() => setActiveTab('json')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors ${activeTab === 'json' ? 'text-green-400 border-b-2 border-green-500 bg-slate-800/50' : 'text-slate-500'}`}
                >
                    Raw Data
                </button>
            </div>

            {/* Content */}
            <div className="p-4 h-[400px] overflow-y-auto font-mono text-xs">
                {activeTab === 'logic' && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <div>
                                <div className="text-white font-bold mb-1">Input Received</div>
                                <div className="text-slate-400">Processing natural language query...</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <div>
                                <div className="text-white font-bold mb-1">Vectorization (text-embedding-004)</div>
                                <div className="text-slate-400">Converting text to 768-dimensional vector space.</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                            <div>
                                <div className="text-white font-bold mb-1">Semantic Search (Cosine Similarity)</div>
                                <div className="text-slate-400">Comparing against partner knowledge base.</div>
                            </div>
                        </div>
                        {score !== undefined && (
                            <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-slate-600">
                                <div className="text-slate-400 mb-1 uppercase tracking-widest text-[10px]">Match Confidence</div>
                                <div className="text-3xl font-black text-white">{score}%</div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{ width: `${score}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'vector' && (
                    <div className="space-y-2">
                        <div className="text-slate-400 mb-2">Visualizing high-dimensional embedding space:</div>
                        <div className="flex items-end gap-[2px] h-32 border-b border-slate-700 pb-1">
                            {simulatedVectors.map((v, i) => (
                                <div 
                                    key={i} 
                                    className="flex-1 bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t-sm"
                                    style={{ height: `${v * 100}%` }}
                                    title={`Dimension ${i}: ${v.toFixed(4)}`}
                                ></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-[10px] text-slate-500 uppercase">Model</div>
                                <div className="text-white">text-embedding-004</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-[10px] text-slate-500 uppercase">Dimensions</div>
                                <div className="text-white">768</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'json' && (
                    <pre className="text-[10px] leading-relaxed text-green-400 overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    );
};

export default AIUnderTheHood;
