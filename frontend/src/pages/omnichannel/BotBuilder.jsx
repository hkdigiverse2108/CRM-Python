import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useApp } from '@/context/AppContext';
import { 
  Play, Sparkles, BookOpen, Plus, Undo, Redo, Save, CornerRightDown, 
  HelpCircle, X, ChevronRight, MessageSquare, HelpCircle as QuestionIcon,
  GitBranch, Bot, Clock, ShieldAlert, Settings, AlertCircle, Trash2, Send
} from 'lucide-react';

// ─── CUSTOM FLOW NODES ───────────────────────────────────────────────

const nodeBaseClass = "w-[240px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-4 transition-all hover:shadow-lg select-none relative";

const SendMessageNode = ({ data, selected }) => (
  <div className={`${nodeBaseClass} border-l-4 border-l-emerald-500 ${selected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
    <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-emerald-500" />
    <div className="flex items-center gap-2 mb-2">
      <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450">Send Message</span>
    </div>
    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 line-clamp-3 leading-relaxed">
      {data.message?.text || "No text defined..."}
    </p>
    {data.message?.image && (
      <div className="mt-2 text-[9px] text-slate-450 truncate bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
        🖼 Attachment configured
      </div>
    )}
    <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-emerald-500" />
  </div>
);

const AskQuestionNode = ({ data, selected }) => (
  <div className={`${nodeBaseClass} border-l-4 border-l-sky-500 ${selected ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
    <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-sky-500" />
    <div className="flex items-center gap-2 mb-2">
      <QuestionIcon className="w-4 h-4 text-sky-500 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-450">Ask Question</span>
    </div>
    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 line-clamp-2 leading-relaxed">
      {data.message?.text || "Please respond:"}
    </p>
    <div className="mt-2 flex items-center justify-between">
      <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
        {"${" + (data.variable || "answer") + "}"}
      </span>
    </div>
    <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-sky-500" />
  </div>
);

const ConditionNode = ({ data, selected }) => (
  <div className={`${nodeBaseClass} border-l-4 border-l-amber-500 ${selected ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
    <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-amber-500" />
    <div className="flex items-center gap-2 mb-2">
      <GitBranch className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-450">Condition</span>
    </div>
    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 space-y-1">
      <p className="truncate">If <span className="font-mono text-indigo-500">{"${" + (data.condition?.variable || "var") + "}"}</span></p>
      <p className="text-[10px] text-slate-450 capitalize font-medium">{data.condition?.operator || "equals"} "{data.condition?.value || ""}"</p>
    </div>
    
    {/* Expose Dual Output Handles (True/False) */}
    <div className="flex flex-col gap-2 mt-3 text-[9px] font-bold text-slate-450 text-right pr-2">
      <div className="relative h-4">
        True
        <Handle id="True" type="source" position={Position.Right} style={{ top: '50%' }} className="w-2 h-2 bg-emerald-500" />
      </div>
      <div className="relative h-4">
        False
        <Handle id="False" type="source" position={Position.Right} style={{ top: '50%' }} className="w-2 h-2 bg-rose-500" />
      </div>
    </div>
  </div>
);

const AiAgentNode = ({ data, selected }) => (
  <div className={`${nodeBaseClass} border-l-4 border-l-purple-500 ${selected ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
    <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-purple-500" />
    <div className="flex items-center gap-2 mb-2">
      <Bot className="w-4 h-4 text-purple-500 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-450">AI Agent</span>
    </div>
    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 line-clamp-3 leading-relaxed">
      {data.aiPrompt || "Act as a helpful representative..."}
    </p>
    <div className="mt-2 text-[9px] text-slate-450">
      Exit Keyword: <span className="font-mono font-bold text-rose-500">"FINISHED"</span>
    </div>
    <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-purple-500" />
  </div>
);

const WaitDelayNode = ({ data, selected }) => (
  <div className={`${nodeBaseClass} border-l-4 border-l-pink-500 ${selected ? 'ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
    <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-pink-500" />
    <div className="flex items-center gap-2 mb-2">
      <Clock className="w-4 h-4 text-pink-500 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-450">Wait Delay</span>
    </div>
    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350">
      Pause flow for <span className="font-bold text-pink-600">{data.delaySeconds || 5} seconds</span>
    </p>
    <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-pink-500" />
  </div>
);

const HumanHandoffNode = ({ data, selected }) => (
  <div className={`${nodeBaseClass} border-l-4 border-l-rose-500 ${selected ? 'ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
    <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-rose-500" />
    <div className="flex items-center gap-2">
      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-450">Human Handoff</span>
    </div>
    <p className="text-[10px] text-slate-400 mt-2">
      (Terminal Block) Alerts agents & locks Chat status.
    </p>
  </div>
);

// Map custom node types
const nodeTypes = {
  message: SendMessageNode,
  question: AskQuestionNode,
  condition: ConditionNode,
  ai: AiAgentNode,
  delay: WaitDelayNode,
  handoff: HumanHandoffNode
};

// ─── MAIN BUILDER CONTAINER ──────────────────────────────────────────

function FlowCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect, 
  setSelectedNodeId, 
  pushHistory 
}) {
  const reactFlowInstance = useReactFlow();

  const handleNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 relative min-h-[500px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          // Only push history for major structural updates to avoid flooding state
          if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
            pushHistory(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
          }
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
            pushHistory(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
          }
        }}
        onConnect={(connection) => {
          onConnect(connection);
          pushHistory(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
        }}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        snapGrid={[16, 16]}
        fitView
      >
        <Background gap={16} size={1} color="#cbd5e1" className="opacity-40" />
        <MiniMap nodeStrokeWidth={3} className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        <Controls className="dark:bg-slate-900 dark:border-slate-800" />
      </ReactFlow>
    </div>
  );
}

export default function BotBuilder() {
  const { addToast, token, tenantId } = useApp();

  // 1. Core State
  const [flowsList, setFlowsList] = useState([]);
  const [activeFlowId, setActiveFlowId] = useState('');
  const [flowName, setFlowName] = useState('Chab Chabba Chab Water Park');
  const [flowDesc, setFlowDesc] = useState('Primary offline flow responder');
  const [triggerType, setTriggerType] = useState('keyword'); // keyword, any
  const [keywords, setKeywords] = useState('hello, hi, start');
  const [isActive, setIsActive] = useState(false);

  // ReactFlow Nodes & Edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Undo/Redo Stacks
  const historyRef = useRef([]);
  const redoRef = useRef([]);

  // Sidebar controls
  const [showConfig, setShowConfig] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // API Base
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // ─── UNDO / REDO HISTORY ──────────────────────────────────────────

  const pushHistory = useCallback((currentNodes, currentEdges) => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges))
    });
    // Cap history at 30 entries
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    }
    redoRef.current = []; // Clear redo stack on new action
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) {
      addToast('Nothing to undo', 'info');
      return;
    }
    const current = { nodes, edges };
    redoRef.current.push(JSON.parse(JSON.stringify(current)));
    
    const previous = historyRef.current.pop();
    setNodes(previous.nodes);
    setEdges(previous.edges);
    addToast('Undo success', 'info');
  }, [nodes, edges, setNodes, setEdges, addToast]);

  const handleRedo = useCallback(() => {
    if (redoRef.current.length === 0) {
      addToast('Nothing to redo', 'info');
      return;
    }
    const current = { nodes, edges };
    historyRef.current.push(JSON.parse(JSON.stringify(current)));
    
    const next = redoRef.current.pop();
    setNodes(next.nodes);
    setEdges(next.edges);
    addToast('Redo success', 'info');
  }, [nodes, edges, setNodes, setEdges, addToast]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFlow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, nodes, edges]);

  // ─── ADDING FLOW BLOCKS ────────────────────────────────────────────

  const addNode = (type) => {
    const id = `node_${Date.now()}`;
    const titles = {
      message: 'SEND MESSAGE',
      question: 'ASK QUESTION',
      condition: 'CONDITION',
      ai: 'AI AGENT',
      delay: 'WAIT DELAY',
      handoff: 'HUMAN HANDOFF'
    };

    const initialData = {
      message: { message: { text: 'Welcome! How can we assist you today?' } },
      question: { message: { text: 'What is your preferred date? (YYYY-MM-DD)' }, variable: 'preferred_date' },
      condition: { condition: { variable: 'preferred_date', operator: 'exists', value: '' } },
      ai: { aiPrompt: 'You are an assistant for Chab Chabba Chab Water Park. Provide ticket prices: Adult: 999, Child: 599. If customer is satisfied, say FINISHED.' },
      delay: { delaySeconds: 5 },
      handoff: {}
    };

    const newNode = {
      id,
      type,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: initialData[type] || {}
    };

    pushHistory(nodes, edges);
    setNodes(prev => [...prev, newNode]);
    addToast(`Added ${titles[type]} block to canvas.`, 'success');
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    pushHistory(nodes, edges);
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    addToast('Deleted node.', 'info');
  };

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      label: params.sourceHandle || ''
    }, eds));
  }, [setEdges]);

  // ─── CRUD OPERATIONS ──────────────────────────────────────────────

  const fetchFlows = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/flows`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722'
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setFlowsList(result.data || []);
          // Auto load first flow if none selected
          if (result.data.length > 0 && !activeFlowId) {
            loadFlowDetail(result.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, tenantId, activeFlowId]);

  const loadFlowDetail = async (flowId) => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/flows/${flowId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722'
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const detail = result.data;
          setActiveFlowId(detail.id);
          setFlowName(detail.name);
          setFlowDesc(detail.description);
          setTriggerType(detail.trigger.type);
          setKeywords(detail.trigger.keywords.join(', '));
          setIsActive(detail.isActive);
          
          setNodes(detail.nodes || []);
          setEdges(detail.edges || []);
          historyRef.current = [];
          redoRef.current = [];
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load flow details', 'error');
    }
  };

  const createNewFlow = () => {
    const id = `flow_${Date.now().toString().slice(-6)}`;
    setActiveFlowId(id);
    setFlowName('New Flow Router');
    setFlowDesc('Describe flow triggers');
    setTriggerType('keyword');
    setKeywords('hi, hello');
    setIsActive(false);
    
    // Set default seed trigger nodes
    const entryId = 'trigger_node';
    setNodes([
      { 
        id: entryId, 
        type: 'sendMessage', 
        position: { x: 150, y: 150 }, 
        data: { message: { text: 'Welcome to our messaging router! Select an option.' } } 
      }
    ]);
    setEdges([]);
    historyRef.current = [];
    redoRef.current = [];
  };

  const saveFlow = async () => {
    if (!activeFlowId) {
      addToast('Please create or load a flow first', 'warning');
      return;
    }

    const triggerKeywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const entryNodeId = nodes[0]?.id || '';

    const payload = {
      id: activeFlowId,
      name: flowName,
      description: flowDesc,
      trigger: {
        type: triggerType,
        keywords: triggerKeywordsArray
      },
      entryNodeId,
      isActive,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || '',
        condition: e.condition || null
      }))
    };

    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/flows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addToast('Flow builder saved successfully.', 'success');
        fetchFlows();
      } else {
        addToast('Failed to save flow', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error communicating with backend', 'error');
    }
  };

  const toggleFlowActivation = async (flowId) => {
    try {
      const res = await fetch(`${API_BASE}/integrations/whatsapp/flows/${flowId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '96722'
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setIsActive(result.data.is_active);
          addToast(result.message, 'success');
          fetchFlows();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // Find currently selected node details
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const updateSelectedNodeData = (field, value) => {
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        pushHistory(nodes, edges);
        return {
          ...n,
          data: {
            ...n.data,
            [field]: value
          }
        };
      }
      return n;
    }));
  };

  const updateSelectedNodeMessageText = (txt) => {
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        pushHistory(nodes, edges);
        return {
          ...n,
          data: {
            ...n.data,
            message: {
              ...n.data.message,
              text: txt
            }
          }
        };
      }
      return n;
    }));
  };

  const updateSelectedNodeMessageImage = (imgUrl) => {
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        pushHistory(nodes, edges);
        return {
          ...n,
          data: {
            ...n.data,
            message: {
              ...n.data.message,
              image: imgUrl
            }
          }
        };
      }
      return n;
    }));
  };

  const updateSelectedNodeCondition = (field, value) => {
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        pushHistory(nodes, edges);
        return {
          ...n,
          data: {
            ...n.data,
            condition: {
              ...n.data.condition,
              [field]: value
            }
          }
        };
      }
      return n;
    }));
  };

  // ─── INTERACTIVE SIMULATOR STATE MACHINE ───────────────────────────

  const [simMessages, setSimMessages] = useState([]);
  const [simVariables, setSimVariables] = useState({});
  const [simStatus, setSimStatus] = useState('bot'); // bot, waiting, ai, human
  const [simCurrentNodeId, setSimCurrentNodeId] = useState(null);
  const [simLogs, setSimLogs] = useState([]);
  const [simInputText, setSimInputText] = useState('');

  const initSimulation = () => {
    setSimMessages([
      { sender: 'system', text: '🤖 Chatbot Flow Simulator Initialized. Type your trigger keyword to begin!' }
    ]);
    setSimVariables({ name: 'Simulated User', phone: '+919999988888' });
    setSimStatus('bot');
    setSimCurrentNodeId(null);
    setSimLogs(['[SIM] State initialized. Default variables loaded.']);
  };

  const handleSimSendMessage = async (e) => {
    e.preventDefault();
    if (!simInputText.trim()) return;

    const userText = simInputText.trim();
    setSimInputText('');

    // Prepend user message
    setSimMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSimLogs(prev => [...prev, `[USER] ${userText}`]);

    let currNodeId = simCurrentNodeId;
    let currStatus = simStatus;
    let currVars = { ...simVariables };

    // 1. Trigger flow check if none active
    if (!currNodeId) {
      const matchTrigger = triggerType === 'any' || 
        (triggerType === 'keyword' && keywords.split(',').map(k => k.trim().toLowerCase()).includes(userText.toLowerCase()));
      
      if (matchTrigger && nodes.length > 0) {
        currNodeId = nodes[0].id;
        currStatus = 'bot';
        setSimLogs(prev => [...prev, `[FLOW] Flow triggered! Entering entry node: ${currNodeId}`]);
      } else {
        setSimMessages(prev => [...prev, { sender: 'system', text: 'No matching trigger keywords found. Simulation idle.' }]);
        return;
      }
    }

    // 2. State Machine Loop
    let safetyCounter = 0;
    let lastEvaluatedInput = userText;

    while (currNodeId && safetyCounter < 15) {
      safetyCounter++;
      
      const node = nodes.find(n => n.id === currNodeId);
      if (!node) {
        setSimLogs(prev => [...prev, `[ERROR] Node not found: ${currNodeId}`]);
        currNodeId = null;
        break;
      }

      setSimLogs(prev => [...prev, `[NODE] Evaluating node: ${node.id} (${node.type})`]);

      if (node.type === 'sendMessage') {
        const textTemplate = node.data?.message?.text || '';
        const mediaUrl = node.data?.message?.image || '';
        
        // Interpolate
        let bodyText = textTemplate;
        Object.keys(currVars).forEach(k => {
          bodyText = bodyText.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), currVars[k]);
        });

        // Prepend bot message
        setSimMessages(prev => [...prev, { 
          sender: 'bot', 
          text: bodyText,
          image: mediaUrl
        }]);

        // Fetch outgoing edge
        const edge = edges.find(e => e.source === node.id);
        currNodeId = edge ? edge.target : null;
        currStatus = 'bot';
      } 
      
      else if (node.type === 'askQuestion') {
        const varName = node.data?.variable || 'answer';
        
        if (lastEvaluatedInput !== null) {
          // Store response
          currVars[varName] = lastEvaluatedInput;
          setSimVariables(currVars);
          setSimLogs(prev => [...prev, `[VAR] Saved variable: ${varName} = "${lastEvaluatedInput}"`]);
          
          lastEvaluatedInput = null; // Consume input
          // Fetch outgoing edge
          const edge = edges.find(e => e.source === node.id);
          currNodeId = edge ? edge.target : null;
          currStatus = 'bot';
        } else {
          // Send prompt
          const textTemplate = node.data?.message?.text || 'Please respond:';
          let bodyText = textTemplate;
          Object.keys(currVars).forEach(k => {
            bodyText = bodyText.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), currVars[k]);
          });

          setSimMessages(prev => [...prev, { sender: 'bot', text: bodyText }]);
          currStatus = 'waiting';
          setSimCurrentNodeId(currNodeId);
          setSimStatus(currStatus);
          break;
        }
      } 
      
      else if (node.type === 'condition') {
        const cond = node.data?.condition || {};
        const cVar = cond.variable || '';
        const cOp = cond.operator || 'equals';
        const cVal = String(cond.value || '').toLowerCase().trim();
        
        const varVal = String(currVars[cVar] || '').toLowerCase().trim();
        
        let result = false;
        if (cOp === 'equals') result = (varVal === cVal);
        else if (cOp === 'contains') result = varVal.includes(cVal);
        else if (cOp === 'not_equals') result = (varVal !== cVal);
        else if (cOp === 'exists') result = (cVar in currVars && !!currVars[cVar]);

        const edgeLabel = result ? 'True' : 'False';
        setSimLogs(prev => [...prev, `[COND] Evaluated condition: "${cVar}" ${cOp} "${cVal}" -> result: ${result}`]);

        // Find edge matching label
        let edge = edges.find(e => e.source === node.id && e.label === edgeLabel);
        if (!edge) {
          // fallback
          edge = edges.find(e => e.source === node.id);
        }
        currNodeId = edge ? edge.target : null;
        currStatus = 'bot';
      } 
      
      else if (node.type === 'aiAgent') {
        const prompt = node.data?.aiPrompt || '';
        
        if (lastEvaluatedInput !== null) {
          // AI Conversational state reply simulator
          const lowerInput = lastEvaluatedInput.toLowerCase();
          let reply = `[AI Assistant] I received your message about: "${lastEvaluatedInput}". How else can I help?`;
          
          if (lowerInput.includes('exit') || lowerInput.includes('finished') || lowerInput.includes('done')) {
            reply = "AI: Thank you! Bot Flow FINISHED. Transferring node.";
            setSimMessages(prev => [...prev, { sender: 'bot', text: reply }]);
            
            // Advance to next edge
            const edge = edges.find(e => e.source === node.id);
            currNodeId = edge ? edge.target : null;
            currStatus = 'bot';
            lastEvaluatedInput = null;
          } else {
            setSimMessages(prev => [...prev, { sender: 'bot', text: reply }]);
            currStatus = 'ai';
            setSimCurrentNodeId(currNodeId);
            setSimStatus(currStatus);
            break;
          }
        } else {
          // First prompt trigger
          const aiIntro = `[AI Assistant Initialized] Prompts: "${prompt.slice(0, 40)}..."`;
          setSimMessages(prev => [...prev, { sender: 'bot', text: aiIntro }]);
          currStatus = 'ai';
          setSimCurrentNodeId(currNodeId);
          setSimStatus(currStatus);
          break;
        }
      } 
      
      else if (node.type === 'waitDelay') {
        const sec = node.data?.delaySeconds || 5;
        setSimLogs(prev => [...prev, `[DELAY] Wait delay node triggered: pause for ${sec}s`]);
        const edge = edges.find(e => e.source === node.id);
        currNodeId = edge ? edge.target : null;
        currStatus = 'bot';
      } 
      
      else if (node.type === 'humanHandoff') {
        setSimMessages(prev => [...prev, { sender: 'system', text: '🤝 Transferring ticket to a Live Human Representative. Takeover Lock acquired.' }]);
        currNodeId = null;
        currStatus = 'human';
        break;
      }
    }

    setSimCurrentNodeId(currNodeId);
    setSimStatus(currStatus);
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-[calc(100vh-110px)] select-none">
        
        {/* Visual Canvas SubHeader controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Bot Flow Builder
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Design multi-step auto-response workflows, conversational Q&A forms, and trigger AI prompts.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button 
              onClick={() => { setShowSimulator(true); initSimulation(); }} 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm"
            >
              <Play size={13} className="text-emerald-600" /> Simulate Flow
            </button>
            <button 
              onClick={() => setShowConfig(!showConfig)} 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm"
            >
              <Settings size={13} /> Flow Settings
            </button>
            <button 
              onClick={handleUndo}
              className="p-1.5 border border-slate-250 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 hover:bg-slate-50"
              title="Undo last change (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button 
              onClick={handleRedo}
              className="p-1.5 border border-slate-250 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 hover:bg-slate-50"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={14} />
            </button>
            <button 
              onClick={saveFlow} 
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-sm shadow-emerald-600/10"
            >
              <Save size={13} /> Save Flow
            </button>
          </div>
        </div>

        {/* Global trigger configuration panel */}
        {showConfig && (
          <div className="bg-slate-50 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
            <div>
              <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Select Active Flow</label>
              <select 
                value={activeFlowId}
                onChange={(e) => loadFlowDetail(e.target.value)}
                className="input-field text-xs font-bold"
              >
                {flowsList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} {f.isActive ? '• [ACTIVE]' : ''}</option>
                ))}
                {flowsList.length === 0 && <option value="">No flows found</option>}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Flow Name</label>
              <input 
                type="text" 
                value={flowName} 
                onChange={(e) => setFlowName(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Trigger Trigger Type</label>
              <select 
                value={triggerType} 
                onChange={(e) => setTriggerType(e.target.value)}
                className="input-field text-xs"
              >
                <option value="keyword">Keywords Match</option>
                <option value="any">Any Message (Catch-all)</option>
              </select>
            </div>
            {triggerType === 'keyword' && (
              <div>
                <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Keywords list</label>
                <input 
                  type="text" 
                  value={keywords} 
                  onChange={(e) => setKeywords(e.target.value)}
                  className="input-field text-xs font-mono"
                  placeholder="e.g. start, menu, info"
                />
              </div>
            )}
            <div className="md:col-span-4 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={createNewFlow}
                className="px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900/40 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50"
              >
                + Create New Flow
              </button>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Enable Bot Flow:</span>
                <button 
                  onClick={() => toggleFlowActivation(activeFlowId)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Builder Main workspace area */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left Palette tool shelf */}
          <div className="w-[180px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-3 gap-2 z-10 shrink-0">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2 px-1">Flow Blocks</span>
            <button 
              onClick={() => addNode('message')}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-2.5 rounded-xl text-left text-xs font-bold hover:bg-emerald-50/10 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Send Message
            </button>
            <button 
              onClick={() => addNode('question')}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 p-2.5 rounded-xl text-left text-xs font-bold hover:bg-sky-50/10 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Ask Question
            </button>
            <button 
              onClick={() => addNode('condition')}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 p-2.5 rounded-xl text-left text-xs font-bold hover:bg-amber-50/10 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Condition
            </button>
            <button 
              onClick={() => addNode('ai')}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 p-2.5 rounded-xl text-left text-xs font-bold hover:bg-purple-50/10 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              AI Agent
            </button>
            <button 
              onClick={() => addNode('delay')}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 p-2.5 rounded-xl text-left text-xs font-bold hover:bg-pink-50/10 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              Wait Delay
            </button>
            <button 
              onClick={() => addNode('handoff')}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 p-2.5 rounded-xl text-left text-xs font-bold hover:bg-rose-50/10 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Human Handoff
            </button>
            
            {selectedNodeId && (
              <button 
                onClick={deleteSelectedNode}
                className="mt-auto flex items-center gap-2 w-full p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-950 text-red-600 text-xs font-bold transition-all justify-center"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
          </div>

          {/* Visual Workspace Canvas */}
          <FlowCanvas 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            setSelectedNodeId={setSelectedNodeId}
            pushHistory={pushHistory}
          />

          {/* Right Configuration drawer sidepanel */}
          {selectedNode && (
            <aside className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col p-5 overflow-y-auto z-10 shrink-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Configure Block</h3>
                <button onClick={() => setSelectedNodeId(null)} className="p-1 hover:bg-slate-100 rounded"><X size={15} /></button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                
                {selectedNode.type === 'message' && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Message Text</label>
                      <textarea 
                        rows="4"
                        value={selectedNode.data.message?.text || ''}
                        onChange={(e) => updateSelectedNodeMessageText(e.target.value)}
                        className="input-field font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Image Attachment URL</label>
                      <input 
                        type="text" 
                        value={selectedNode.data.message?.image || ''}
                        onChange={(e) => updateSelectedNodeMessageImage(e.target.value)}
                        className="input-field text-xs font-mono"
                        placeholder="https://example.com/media.png"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'question' && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Question Prompt</label>
                      <textarea 
                        rows="3"
                        value={selectedNode.data.message?.text || ''}
                        onChange={(e) => updateSelectedNodeMessageText(e.target.value)}
                        className="input-field font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Save Response To Variable</label>
                      <input 
                        type="text" 
                        value={selectedNode.data.variable || ''}
                        onChange={(e) => updateSelectedNodeData('variable', e.target.value)}
                        className="input-field text-xs font-mono"
                        placeholder="e.g. user_name"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Evaluate Variable</label>
                      <input 
                        type="text" 
                        value={selectedNode.data.condition?.variable || ''}
                        onChange={(e) => updateSelectedNodeCondition('variable', e.target.value)}
                        className="input-field text-xs font-mono"
                        placeholder="e.g. user_name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Operator</label>
                      <select 
                        value={selectedNode.data.condition?.operator || 'equals'}
                        onChange={(e) => updateSelectedNodeCondition('operator', e.target.value)}
                        className="input-field text-xs"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="not_equals">Does Not Equal</option>
                        <option value="exists">Exists / Is Configured</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Compare Value</label>
                      <input 
                        type="text" 
                        value={selectedNode.data.condition?.value || ''}
                        onChange={(e) => updateSelectedNodeCondition('value', e.target.value)}
                        className="input-field text-xs font-semibold"
                        placeholder="e.g. yes"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'ai' && (
                  <div>
                    <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">AI Prompt & Guardrails</label>
                    <textarea 
                      rows="6"
                      value={selectedNode.data.aiPrompt || ''}
                      onChange={(e) => updateSelectedNodeData('aiPrompt', e.target.value)}
                      className="input-field font-semibold text-xs"
                    />
                  </div>
                )}

                {selectedNode.type === 'delay' && (
                  <div>
                    <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Delay Duration (Seconds)</label>
                    <input 
                      type="number" 
                      value={selectedNode.data.delaySeconds || 5}
                      onChange={(e) => updateSelectedNodeData('delaySeconds', parseInt(e.target.value, 10))}
                      className="input-field text-xs font-bold"
                    />
                  </div>
                )}

                {selectedNode.type === 'handoff' && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 border border-rose-100 dark:border-rose-900/40 rounded-xl space-y-2">
                    <p className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
                      <ShieldAlert size={14} /> Handoff configured
                    </p>
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                      Executing this block stops chatbot loop, sets conversation state status as "human", and updates live chats in active workspaces.
                    </p>
                  </div>
                )}
                
              </div>
            </aside>
          )}

          {/* Interactive Simulator Slide-out Drawer */}
          {showSimulator && (
            <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-25 shadow-2xl shrink-0 absolute right-0 top-0 bottom-0">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Play size={14} className="text-emerald-600" /> In Browser Simulator
                </h3>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={initSimulation} 
                    className="p-1 text-[10px] font-bold text-indigo-600 hover:bg-slate-100 rounded"
                    title="Reset Simulator"
                  >
                    Reset
                  </button>
                  <button onClick={() => setShowSimulator(false)} className="p-1 hover:bg-slate-100 rounded"><X size={15} /></button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                {simMessages.map((m, idx) => {
                  if (m.sender === 'system') {
                    return (
                      <div key={idx} className="text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-1 rounded-lg inline-block border border-slate-200/50">
                          {m.text}
                        </span>
                      </div>
                    );
                  }
                  const isUser = m.sender === 'user';
                  return (
                    <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        isUser 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                      }`}>
                        {m.image && (
                          <div className="mb-1.5 max-w-full rounded overflow-hidden">
                            <img src={m.image} alt="Attachment" className="max-h-[150px] object-cover" />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Variable inspector / execution logs */}
              <div className="h-[100px] border-t border-slate-200 dark:border-slate-800 overflow-y-auto p-2 bg-slate-100/30 dark:bg-slate-900/40 text-[9px] font-mono text-slate-500">
                <p className="font-bold uppercase tracking-wider text-[8px] text-slate-400 mb-1 border-b border-slate-200/50 pb-0.5">Variables & Logs</p>
                <div className="space-y-0.5">
                  <p>State status: <span className="font-bold text-slate-700 dark:text-slate-200">{simStatus}</span></p>
                  <p>Current Node: <span className="font-bold text-slate-700 dark:text-slate-200">{simCurrentNodeId || 'None'}</span></p>
                  {Object.keys(simVariables).map(k => (
                    <p key={k}>{"${" + k + "}"}: <span className="text-slate-800 dark:text-slate-200">"{simVariables[k]}"</span></p>
                  ))}
                  <div className="border-t border-slate-200/50 my-1 pt-1 space-y-0.5">
                    {simLogs.slice(-4).map((log, idx) => (
                      <p key={idx} className="truncate">{log}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Input footer */}
              <form onSubmit={handleSimSendMessage} className="p-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-900 shrink-0">
                <input 
                  type="text" 
                  value={simInputText}
                  onChange={e => setSimInputText(e.target.value)}
                  placeholder="Type a message"
                  className="input-field text-xs flex-1"
                />
                <button type="submit" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                  <Send size={14} />
                </button>
              </form>
            </aside>
          )}

        </div>

      </div>
    </ReactFlowProvider>
  );
}
