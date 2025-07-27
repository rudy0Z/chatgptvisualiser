import type { ForceGraph3DInstance } from 'react-force-graph-3d';

export interface ChatRow {
  id: string;
  conversation_id: string;
  parent_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface GraphNode {
    id: string;
    label: string;
    content: string;
    role: 'user' | 'assistant' | 'conversation_root' | 'central_root' | 'system' | 'tool';
    conversation_id?: string;
    color: string;
    val: number; // size
    x?: number;
    y?: number;
    z?: number;
}

export interface GraphLink {
    source: string;
    target:string;
}

export interface ThreeDGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export type ForceGraphInstance = ForceGraph3DInstance<GraphNode, GraphLink>;