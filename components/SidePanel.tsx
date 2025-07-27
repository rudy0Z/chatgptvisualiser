import React from 'react';
import { GraphNode } from '../types';
import { XIcon, BrainCircuitIcon, LoaderIcon } from './icons';

interface SidePanelProps {
    node: GraphNode | null;
    summary: string | null;
    isSummarizing: boolean;
    onSummarizeThread: (node: GraphNode) => void;
    onSummarizeConversation: (node: GraphNode) => void;
    onClear: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ node, summary, isSummarizing, onSummarizeThread, onSummarizeConversation, onClear }) => {
    const getRolePill = (role: string) => {
        const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (role) {
            case 'user': return `${baseClasses} bg-blue-500 text-white`;
            case 'assistant': return `${baseClasses} bg-emerald-500 text-white`;
            case 'conversation_root': return `${baseClasses} bg-orange-500 text-white`;
            case 'central_root': return `${baseClasses} bg-fuchsia-500 text-white`;
            default: return `${baseClasses} bg-gray-500 text-white`;
        }
    }
    
    return (
        <div
            className={`absolute top-0 right-0 h-full w-full max-w-md transform transition-transform duration-300 ease-in-out ${
                node ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
            <div className="h-full bg-gray-900 bg-opacity-70 backdrop-blur-lg border-l border-gray-700 shadow-2xl flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Node Details</h2>
                    <button
                        onClick={onClear}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close panel"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {node && (
                    <div className="flex-grow p-5 overflow-y-auto">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Role</h3>
                                <span className={getRolePill(node.role)}>{node.role.replace(/_/g, ' ')}</span>
                            </div>

                             <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Label</h3>
                                <p className="text-gray-200">{node.label}</p>
                            </div>

                            { (node.role === 'user' || node.role === 'assistant') &&
                              <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Content</h3>
                                <p className="text-gray-300 text-base whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded-md">{node.content}</p>
                            </div>
                            }
                            
                            <div className="pt-4 border-t border-gray-700">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">AI Analysis</h3>
                                { (node.role === 'user' || node.role === 'assistant') &&
                                    <button
                                        onClick={() => onSummarizeThread(node)}
                                        disabled={isSummarizing}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-gray-900 disabled:bg-fuchsia-800 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSummarizing ? <LoaderIcon className="w-5 h-5 mr-2" /> : <BrainCircuitIcon className="w-5 h-5 mr-2" />}
                                        {isSummarizing ? 'Summarizing...' : 'Summarize Thread'}
                                    </button>
                                }
                                { node.role === 'conversation_root' &&
                                    <button
                                        onClick={() => onSummarizeConversation(node)}
                                        disabled={isSummarizing}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:bg-orange-800 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSummarizing ? <LoaderIcon className="w-5 h-5 mr-2" /> : <BrainCircuitIcon className="w-5 h-5 mr-2" />}
                                        {isSummarizing ? 'Summarizing...' : 'Generate Full Conversation Summary'}
                                    </button>
                                }
                                {summary && (
                                    <div className="mt-4 p-3 bg-gray-800 rounded-md">
                                        <h4 className="font-semibold text-fuchsia-400 mb-1">Summary:</h4>
                                        <p className="text-gray-300">{summary}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidePanel;
