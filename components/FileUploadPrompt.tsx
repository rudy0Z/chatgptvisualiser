
import React, { useCallback, useState, useEffect } from 'react';
import { UploadCloudIcon, BrainCircuitIcon, LoaderIcon } from './icons';

interface FileUploadPromptProps {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    loadingText: string;
}

const FileUploadPrompt: React.FC<FileUploadPromptProps> = ({ onFileUpload, isLoading, loadingText }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileUpload(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onFileUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
            </div>

            <div className={`relative z-10 max-w-4xl mx-auto px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="relative mb-8">
                        <BrainCircuitIcon className="w-24 h-24 mx-auto text-fuchsia-400 animate-pulse" />
                        <div className="absolute inset-0 w-24 h-24 mx-auto bg-fuchsia-400/20 rounded-full blur-xl animate-ping"></div>
                    </div>
                    
                    <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-blue-400 mb-6 leading-tight">
                        ChatGPT Visualiser
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
                        Transform your AI conversations into
                    </p>
                    <p className="text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-8">
                        stunning 3D neural networks
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        <div className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-fuchsia-500/30">
                            <span className="text-fuchsia-400 font-medium">🎮 WASD Controls</span>
                        </div>
                        <div className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-purple-500/30">
                            <span className="text-purple-400 font-medium">🌟 Immersive 3D</span>
                        </div>
                        <div className="px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-blue-500/30">
                            <span className="text-blue-400 font-medium">⚡ Real-time Physics</span>
                        </div>
                    </div>
                </div>

                {/* Upload Section */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="relative mb-6">
                            <LoaderIcon className="w-16 h-16 text-fuchsia-500" />
                            <div className="absolute inset-0 w-16 h-16 bg-fuchsia-500/20 rounded-full blur-lg animate-pulse"></div>
                        </div>
                        <p className="text-2xl text-white font-medium mb-2">Processing Your Data</p>
                        <p className="text-lg text-gray-400">{loadingText}</p>
                        <div className="mt-6 w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`relative block w-full rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 transform hover:scale-105 ${
                                isDragging 
                                    ? 'border-fuchsia-400 bg-fuchsia-500/10 shadow-2xl shadow-fuchsia-500/25' 
                                    : 'border-gray-600 hover:border-fuchsia-500/50 bg-gray-800/30 backdrop-blur-sm'
                            }`}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="sr-only"
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="relative mb-6">
                                    <UploadCloudIcon className="mx-auto h-20 w-20 text-gray-400 transition-colors duration-300 hover:text-fuchsia-400" />
                                    {isDragging && (
                                        <div className="absolute inset-0 mx-auto h-20 w-20 bg-fuchsia-400/20 rounded-full blur-lg animate-pulse"></div>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    <p className="text-2xl font-bold text-white">
                                        Drop your ChatGPT CSV here
                                    </p>
                                    <p className="text-lg text-gray-400">
                                        or <span className="text-fuchsia-400 underline hover:text-fuchsia-300">click to browse</span>
                                    </p>
                                    
                                    <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                        <p className="text-sm text-gray-500 mb-2">
                                            <strong className="text-gray-400">Required columns:</strong>
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {['id', 'conversation_id', 'parent_id', 'role', 'content'].map((col) => (
                                                <span key={col} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs font-mono">
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Instructions */}
                        <div className="mt-12 text-center">
                            <p className="text-gray-400 mb-4">
                                Don't have a CSV? 
                                <a 
                                    href="https://github.com/rudy0Z/chatgptvisualiser#-data-format" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 text-fuchsia-400 hover:text-fuchsia-300 underline"
                                >
                                    Learn how to export from ChatGPT
                                </a>
                            </p>
                            
                            <div className="flex justify-center space-x-8 text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Secure & Private</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span>No Data Stored</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                    <span>Client-side Only</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadPrompt;
