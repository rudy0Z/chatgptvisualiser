
import React, { useState, useCallback, useMemo } from 'react';
import { ThreeDGraphData, GraphNode, ChatRow } from './types';
import FileUploadPrompt from './components/FileUploadPrompt';
import GraphVisualizer from './components/GraphVisualizer';
import SidePanel from './components/SidePanel';
import { getConversationSummary } from './services/geminiService';
import { BrainCircuitIcon } from './components/icons';

declare const Papa: any;

const NODE_COLORS: { [key: string]: string } = {
    user: '#3b82f6', // blue-500
    assistant: '#10b981', // emerald-500
    system: '#64748b', // slate-500
    tool: '#a855f7', // purple-500
    conversation_root: '#f97316', // orange-500
    central_root: '#d946ef', // fuchsia-500
};

// Helper to find a header in a list of fields, case-insensitive
const findHeader = (fields: string[], possibleNames: string[]): string | undefined => {
    const lowerCaseFields = fields.map(f => f.toLowerCase().trim());
    for (const name of possibleNames) {
        const lowerCaseName = name.toLowerCase();
        const index = lowerCaseFields.indexOf(lowerCaseName);
        if (index !== -1) {
            return fields[index]; // Return original case header
        }
    }
    return undefined;
};


const App: React.FC = () => {
    const [graphData, setGraphData] = useState<ThreeDGraphData | null>(null);
    const [allRows, setAllRows] = useState<ChatRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Waiting for file...");
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const processChatData = useCallback(async (data: ChatRow[]) => {
        try {
            setIsLoading(true);
            setLoadingMessage("Processing conversations...");

            setAllRows(data);
            const messagesMap = new Map<string, ChatRow>();
            data.forEach(row => row.id && messagesMap.set(row.id, row));

            const nodes: GraphNode[] = [];
            const links: { source: string; target: string }[] = [];

            // 1. Add central root node
            nodes.push({ id: 'ROOT', label: 'You', content: 'Central node representing all conversations.', role: 'central_root', color: NODE_COLORS.central_root, val: 30 });

            const conversationRoots = new Map<string, string>();
            const conversationFirstMessages = new Map<string, ChatRow>();

            // Find the first message for each conversation to use for labeling
            for (const row of data) {
                if (!row.id || !row.conversation_id) {
                    continue;
                }
            
                // A message is a "first message" if its parent_id is missing/falsy OR not in our map of messages.
                // This correctly identifies the start of a thread.
                const isFirstInThread = !row.parent_id || !messagesMap.has(row.parent_id);
                
                // If it's the first message we've found for this conversation, store it.
                if (isFirstInThread && !conversationFirstMessages.has(row.conversation_id)) {
                    conversationFirstMessages.set(row.conversation_id, row);
                }
            }


            // 2. Create all message nodes
            for (const row of data) {
                if(!row.id) continue;
                nodes.push({
                    id: row.id,
                    label: `${row.role}: ${row.content.substring(0, 30)}...`,
                    content: row.content,
                    role: row.role,
                    conversation_id: row.conversation_id,
                    color: NODE_COLORS[row.role] || '#6b7280',
                    val: 3,
                });
            }

            // 3. Create links and conversation roots
            for (const row of data) {
                 if(!row.id) continue;
                if (row.parent_id && messagesMap.has(row.parent_id)) {
                    links.push({ source: row.id, target: row.parent_id });
                } else {
                    let convRootId = conversationRoots.get(row.conversation_id);
                    if (!convRootId) {
                        convRootId = `conv_root_${row.conversation_id}`;
                        conversationRoots.set(row.conversation_id, convRootId);
                        
                        const firstMessage = conversationFirstMessages.get(row.conversation_id);
                        const title = firstMessage ? firstMessage.content.substring(0, 50) + '...' : 'Conversation';

                        nodes.push({
                            id: convRootId,
                            label: title,
                            content: `Root of conversation: "${title}"`,
                            role: 'conversation_root',
                            conversation_id: row.conversation_id,
                            color: NODE_COLORS.conversation_root,
                            val: 8,
                        });
                        links.push({ source: convRootId, target: 'ROOT' });
                    }
                    links.push({ source: row.id, target: convRootId });
                }
            }
            
            setGraphData({ nodes, links });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleFileChange = useCallback((file: File) => {
        setIsLoading(true);
        setLoadingMessage("Parsing your CSV file...");
        setError(null);
        setGraphData(null);
        setSelectedNode(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: { data: any[], meta: { fields: string[] } }) => {
                const { data, meta } = results;
                const fields = meta.fields || [];

                const headerMapping = {
                    id: findHeader(fields, ['id']),
                    conversation_id: findHeader(fields, ['conversation_id', 'conversation id']),
                    parent_id: findHeader(fields, ['parent_id', 'parent id']),
                    role: findHeader(fields, ['role']),
                    content: findHeader(fields, ['content']),
                };

                const missingHeaders = Object.entries(headerMapping)
                    .filter(([, value]) => !value)
                    .map(([key]) => key);

                if (missingHeaders.length > 0) {
                    setError(`CSV file is missing required columns: ${missingHeaders.join(', ')}. Please check your file's headers.`);
                    setIsLoading(false);
                    return;
                }

                const chatData: ChatRow[] = data.map((row: any) => ({
                    id: row[headerMapping.id!],
                    conversation_id: row[headerMapping.conversation_id!],
                    parent_id: row[headerMapping.parent_id!],
                    role: row[headerMapping.role!],
                    content: row[headerMapping.content!],
                })).filter(row => row.id && row.conversation_id && row.role && row.content);
                
                if (chatData.length === 0) {
                    setError("No valid chat data found in the CSV file.");
                    setIsLoading(false);
                    return;
                }

                processChatData(chatData);
            },
            error: (err: any) => {
                setError(`CSV Parsing Error: ${err.message}`);
                setIsLoading(false);
            },
        });
    }, [processChatData]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNode(node);
        setSummary(null);
    }, []);

    const handleBackgroundClick = useCallback(() => {
        setSelectedNode(null);
        setSummary(null);
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedNode(null);
        setSummary(null);
    }, []);

    const handleReset = useCallback(() => {
        setGraphData(null);
        setSelectedNode(null);
        setAllRows([]);
        setError(null);
        setIsLoading(false);
    }, []);

    const handleToggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    const handleRequestThreadSummary = useCallback(async (startNode: GraphNode) => {
        if (!graphData) return;
        setIsSummarizing(true);
        setSummary(null);

        const thread: GraphNode[] = [];
        let currentNode: GraphNode | undefined = startNode;
        const nodesMap = new Map(graphData.nodes.map(n => [n.id, n]));
        const linksMap = new Map(graphData.links.map(l => [l.source, l.target]));

        while(currentNode) {
            thread.unshift(currentNode);
            const parentId = linksMap.get(currentNode.id);
            if (!parentId) break;

            const parentNode = nodesMap.get(parentId);
            if (!parentNode || parentNode.role === 'conversation_root' || parentNode.role === 'central_root') break;
            
            currentNode = parentNode;
        }

        const threadText = thread
            .filter(n => n.role === 'user' || n.role === 'assistant')
            .map(n => `${n.role.charAt(0).toUpperCase() + n.role.slice(1)}: ${n.content}`)
            .join('\n\n');

        const result = await getConversationSummary(threadText);
        setSummary(result);
        setIsSummarizing(false);
    }, [graphData]);

    const handleRequestConversationSummary = useCallback(async (conversationNode: GraphNode) => {
        if (!conversationNode.conversation_id) return;
        setIsSummarizing(true);
        setSummary(null);

        const conversationMessages = allRows
            .filter(row => row.conversation_id === conversationNode.conversation_id && (row.role === 'user' || row.role === 'assistant'))
            .sort((a, b) => a.id.localeCompare(b.id)); // A simple sort, might need improvement based on actual IDs
        
        const threadText = conversationMessages
            .map(n => `${n.role.charAt(0).toUpperCase() + n.role.slice(1)}: ${n.content}`)
            .join('\n\n');

        const result = await getConversationSummary(threadText);
        setSummary(result);
        setIsSummarizing(false);
    }, [allRows]);
    
    return (
        <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
            {graphData ? (
                <>
                 {/* Header UI - only show when not in fullscreen */}
                 {!isFullscreen && (
                     <div className="absolute top-4 left-4 z-10 flex items-center space-x-4">
                         <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-900/50 backdrop-blur-sm">
                             <BrainCircuitIcon className="w-8 h-8 text-fuchsia-400" />
                            <h1 className="text-xl font-bold text-white">ChatGPT Visualiser</h1>
                         </div>
                        <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-white bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm rounded-lg transition-colors">
                            Upload New
                        </button>
                     </div>
                 )}
                 
                 <GraphVisualizer 
                    data={graphData} 
                    onNodeClick={handleNodeClick} 
                    onBackgroundClick={handleBackgroundClick}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                 />
                 
                 {/* Side Panel - only show when not in fullscreen */}
                 {!isFullscreen && (
                     <SidePanel 
                        node={selectedNode}
                        summary={summary}
                        isSummarizing={isSummarizing}
                        onSummarizeThread={handleRequestThreadSummary}
                        onSummarizeConversation={handleRequestConversationSummary}
                        onClear={handleClearSelection}
                    />
                 )}
                </>
            ) : (
                <FileUploadPrompt onFileUpload={handleFileChange} isLoading={isLoading} loadingText={loadingMessage} />
            )}
            
            {/* Error messages - always show */}
            {error && (
                <div className="absolute bottom-4 left-4 z-20 p-4 max-w-md bg-red-800 border border-red-600 text-white rounded-lg shadow-lg">
                    <p className="font-bold">An Error Occurred</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="absolute top-2 right-2 p-1 text-red-200 hover:text-white">&times;</button>
                </div>
            )}
        </main>
    );
};

export default App;
