import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Play, CheckCircle2, MousePointer2 } from 'lucide-react';

export interface DemoStep {
    id: string;
    title: string;
    script: string;
    targetId?: string; // ID of the element to highlight
    action?: 'click' | 'type' | 'wait' | 'read';
    autoAction?: () => Promise<void>; // Function to execute automatically
    
    // Navigation State
    section?: 'vision' | 'partner' | 'admin' | 'impact';
    view?: 'cover' | 'problem' | 'arch' | 'impact' | 'dashboard' | 'admin_dashboard';
    context?: any;
}

interface Props {
    currentStep: DemoStep;
    onNext: () => void;
    onPrev: () => void;
    totalSteps: number;
    currentStepIndex: number;
    headless?: boolean;
}

const DemoCopilot: React.FC<Props> = ({ 
    currentStep, 
    onNext, 
    onPrev, 
    totalSteps, 
    currentStepIndex,
    headless = false
}) => {
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);

    useEffect(() => {
        if (currentStep.targetId) {
            const updateHighlight = () => {
                const el = document.getElementById(currentStep.targetId!);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setHighlightStyle({
                        position: 'fixed',
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                        borderRadius: '12px',
                        border: '3px solid #f59e0b', // Amber-500
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease-out'
                    });
                } else {
                    setHighlightStyle(null);
                }
            };

            updateHighlight();
            window.addEventListener('resize', updateHighlight);
            window.addEventListener('scroll', updateHighlight, true);
            
            // Poll for element appearance (in case of animations)
            const interval = setInterval(updateHighlight, 500);

            return () => {
                window.removeEventListener('resize', updateHighlight);
                window.removeEventListener('scroll', updateHighlight, true);
                clearInterval(interval);
            };
        } else {
            setHighlightStyle(null);
        }
    }, [currentStep.targetId]);

    return (
        <>
            {/* Highlighter Overlay */}
            {highlightStyle && (
                <div style={highlightStyle} className="animate-pulse">
                </div>
            )}

            {/* Copilot Control Bar */}
            {!headless && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-slate-900/90 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl border border-slate-700 z-[10000] flex flex-col gap-4 transition-all duration-300">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div>
                        <h3 className="font-bold text-amber-400 text-sm uppercase tracking-widest mb-1">Demo Copilot • Step {currentStepIndex + 1}/{totalSteps}</h3>
                        <h2 className="text-xl font-bold">{currentStep.title}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onPrev} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">Previous</button>
                        <button 
                            onClick={onNext} 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/50 transition-all"
                        >
                            Next Step <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="font-medium text-lg leading-relaxed text-slate-200">
                    "{currentStep.script}"
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-blue-500 h-full transition-all duration-500" 
                        style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>
            )}
        </>
    );
};

export default DemoCopilot;
