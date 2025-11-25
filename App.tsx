import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Button } from './components/Button';
import { refineTextWithPaper } from './services/geminiService';
import { RefinementResult, RefinementSegment } from './types';
import { ArrowRight, ArrowDown, BookOpen, Quote, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// Component to render the segmented sentence with correct coloring
const SegmentedSentence: React.FC<{ 
  segments: RefinementSegment[];
  onSegmentHover: (segment: RefinementSegment | null) => void;
  activeSegment: RefinementSegment | null;
}> = ({ segments, onSegmentHover, activeSegment }) => {
  return (
    <p className="text-lg leading-relaxed text-slate-800 font-serif">
      {segments.map((segment, i) => {
        const isActive = activeSegment === segment;
        
        // Base classes
        let classes = "transition-all duration-200 decoration-2 decoration-offset-2 ";
        
        if (segment.type === 'original') {
          return <span key={i} className="text-slate-600 opacity-90">{segment.text}</span>;
        }

        if (segment.type === 'style') {
          // Green for style/general mods
          classes += "text-green-700 bg-green-100 border-b-2 border-green-300 rounded px-0.5 mx-0.5 cursor-default ";
          if (isActive) classes += "bg-green-200 border-green-500 ";
        }

        if (segment.type === 'source') {
          // Orange for PDF-based mods
          classes += "text-orange-800 bg-orange-100 border-b-2 border-orange-300 rounded px-0.5 mx-0.5 cursor-pointer ";
          if (isActive) classes += "bg-orange-200 border-orange-600 shadow-sm ";
        }

        return (
          <span 
            key={i} 
            className={classes}
            onMouseEnter={() => onSegmentHover(segment)}
            onMouseLeave={() => onSegmentHover(null)}
          >
            {segment.text}
          </span>
        );
      })}
    </p>
  );
};

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [inputText, setInputText] = useState('');
  const [lastRefinedInput, setLastRefinedInput] = useState('');
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RefinementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<RefinementSegment | null>(null);

  const handleRefine = async () => {
    if (files.length === 0 || !inputText.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const data = await refineTextWithPaper(files, inputText, instruction);
      setResult(data);
      setLastRefinedInput(inputText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter segments to only show those that have explanations or sources in the details panel
  const notableSegments = result?.segments.filter(s => s.type !== 'original') || [];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ScholarRefine</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                  <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                  Upload Reference Papers
                </h2>
                <FileUpload files={files} onFilesChange={setFiles} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                  <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                  Draft Sentence
                </h2>
                <textarea
                  className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow resize-none text-slate-800"
                  placeholder="Paste the sentence you want to verify or refine..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                  <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                  Instructions <span className="text-slate-400 font-normal ml-1 normal-case">(Optional)</span>
                </h2>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow text-slate-800"
                  placeholder="e.g., Check for factual errors, make it concise..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleRefine} 
                  disabled={files.length === 0 || !inputText.trim()} 
                  isLoading={isProcessing}
                  className="w-full text-lg py-6 shadow-md shadow-brand-500/20"
                >
                  {isProcessing ? 'Analyzing Papers...' : 'Refine Sentence'}
                  {!isProcessing && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 text-red-800">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-brand-500" />
                Refinement Result
              </div>
              {result && (
                <div className="flex items-center space-x-3 text-xs font-medium">
                   <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-200 border border-green-400 mr-1.5"></span>
                      <span className="text-slate-600">Modified</span>
                   </div>
                   <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-orange-200 border border-orange-400 mr-1.5"></span>
                      <span className="text-slate-600">From PDF</span>
                   </div>
                </div>
              )}
            </h2>

            {!result ? (
              <div className="h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-slate-300" />
                </div>
                <p className="max-w-xs text-sm">Upload PDF(s) and enter your sentence. The AI will mark stylistic changes in <span className="text-green-600 font-semibold">green</span> and PDF-backed corrections in <span className="text-orange-600 font-semibold">orange</span>.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Comparison Block */}
                <div className="relative space-y-2">
                  
                  {/* Original */}
                  <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 text-slate-500 relative">
                     <div className="absolute top-4 right-4 text-xs font-bold text-slate-400 uppercase tracking-wide bg-slate-200 px-2 py-1 rounded">
                       Original
                     </div>
                     <p className="text-lg leading-relaxed font-serif opacity-70 pr-16">{lastRefinedInput}</p>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex justify-center -my-5 relative z-10">
                     <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm text-slate-400">
                        <ArrowDown className="w-5 h-5" />
                     </div>
                  </div>

                  {/* Refined */}
                  <div className="bg-white rounded-xl p-6 border-2 border-brand-100 shadow-lg text-slate-900 relative">
                     <div className="absolute top-4 right-4 flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-xs font-bold text-brand-600 uppercase tracking-wide bg-brand-50 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Refined</span>
                        </div>
                     </div>
                     <div className="pr-10 pt-2">
                      <SegmentedSentence 
                        segments={result.segments} 
                        activeSegment={activeSegment}
                        onSegmentHover={setActiveSegment}
                      />
                     </div>
                  </div>
                </div>

                {/* Change Log / References Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center justify-between">
                    <span>Change Details</span>
                    <span className="text-xs font-normal normal-case bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
                      {notableSegments.length} {notableSegments.length === 1 ? 'mod' : 'mods'}
                    </span>
                  </h3>
                  
                  {notableSegments.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-500 text-center italic">
                      No significant changes were made to the sentence.
                    </div>
                  ) : (
                    notableSegments.map((segment, idx) => (
                      <div 
                        key={idx}
                        className={`
                          bg-white rounded-xl border transition-all duration-200 overflow-hidden
                          ${activeSegment === segment 
                            ? (segment.type === 'source' ? 'border-orange-400 ring-1 ring-orange-400' : 'border-green-400 ring-1 ring-green-400')
                            : 'border-slate-200 hover:border-slate-300 shadow-sm'
                          }
                        `}
                        onMouseEnter={() => setActiveSegment(segment)}
                        onMouseLeave={() => setActiveSegment(null)}
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <span className={`
                              inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                              ${segment.type === 'source' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}
                            `}>
                              {segment.type === 'source' ? 'Based on PDF' : 'Stylistic'}
                            </span>
                            <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">"{segment.text}"</span>
                          </div>
                          
                          {/* Explanation */}
                          {segment.explanation && (
                            <div className="flex items-start space-x-2">
                              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-slate-600">{segment.explanation}</p>
                            </div>
                          )}

                          {/* Source Quote (Only for Source type) */}
                          {segment.type === 'source' && segment.originalSource && (
                            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="flex items-start space-x-2">
                                <Quote className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Reference in PDF</p>
                                  <p className="text-slate-800 text-sm italic font-serif leading-relaxed">"{segment.originalSource}"</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
