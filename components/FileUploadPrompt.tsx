
import React, { useCallback, useState } from 'react';
import { UploadCloudIcon, BrainCircuitIcon, LoaderIcon } from './icons';

interface FileUploadPromptProps {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    loadingText: string;
}

const FileUploadPrompt: React.FC<FileUploadPromptProps> = ({ onFileUpload, isLoading, loadingText }) => {
    const [isDragging, setIsDragging] = useState(false);

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm p-8 text-center">
            <div className="max-w-2xl">
                <BrainCircuitIcon className="w-16 h-16 mx-auto text-fuchsia-400 mb-4" />
                <h1 className="text-4xl font-bold text-white mb-2">ChatGPT Visualiser</h1>
                <p className="text-lg text-gray-400 mb-8">
                    Upload your ChatGPT history CSV to explore your conversations as an interactive 3D neural network.
                </p>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                        <LoaderIcon className="w-12 h-12 text-fuchsia-500" />
                        <p className="mt-4 text-lg">{loadingText}</p>
                    </div>
                ) : (
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center transition-colors duration-200 ${
                            isDragging ? 'border-fuchsia-400 bg-gray-800' : 'border-gray-600 hover:border-gray-500'
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
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <span className="mt-2 block font-semibold text-white">
                                Drop a CSV file here or click to upload
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                                Make sure it contains 'id', 'conversation_id', 'parent_id', 'role', and 'content' columns.
                            </span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadPrompt;
