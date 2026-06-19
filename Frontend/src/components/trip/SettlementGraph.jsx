import { useEffect, useRef, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import "./SettlementGraph.css";

const fmt = (amount) =>
  `₹${Math.round(Math.abs(amount)).toLocaleString("en-IN")}`;

const initials = (name) => name.slice(0, 2).toUpperCase();

function MemberNode({ data }) {
  const { name, balance, type } = data;
  const isReceiver = type === "recv";

  return (
    <div className={`sg-node-card sg-node-card--${type}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="sg-handle"
        style={{ visibility: isReceiver ? "visible" : "hidden" }}
      />

      <div className={`sg-avatar sg-avatar--${type}`}>
        {initials(name)}
      </div>

      <p className="sg-node-name">{name}</p>

      <p className={`sg-node-amount sg-node-amount--${type}`}>
        {isReceiver ? "+" : "−"}
        {fmt(balance)}
      </p>

      <p className="sg-node-role">
        {isReceiver ? "Receives" : "Pays"}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        className="sg-handle"
        style={{ visibility: isReceiver ? "hidden" : "visible" }}
      />
    </div>
  );
}

const NODE_TYPES = { member: MemberNode };

const V_GAP = 130;
const LEFT_X = 60;
const RIGHT_X = 420;

export default function SettlementGraph({ balances, transactions }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildGraph = useCallback(() => {
    const payers    = balances.filter((m) => m.balance < 0);
    const receivers = balances.filter((m) => m.balance > 0);

    const yFor = (index, total) => {
      const usable = (total - 1) * V_GAP;
      return 20 + index * V_GAP - usable / 2;
    };

    const built = [];

    payers.forEach((m, i) => {
      built.push({
        id: m.name,
        type: "member",
        position: { x: LEFT_X, y: yFor(i, payers.length) },
        data: { name: m.name, balance: m.balance, type: "pay" },
        draggable: false,
      });
    });

    receivers.forEach((m, i) => {
      built.push({
        id: m.name,
        type: "member",
        position: { x: RIGHT_X, y: yFor(i, receivers.length) },
        data: { name: m.name, balance: m.balance, type: "recv" },
        draggable: false,
      });
    });

    setNodes(built);

    const builtEdges = transactions.map((tx, i) => ({
      id: `e-${i}`,
      source: tx.from,
      target: tx.to,
      label: fmt(tx.amount),
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#E24B4A",
        width: 16,
        height: 16,
      },
      style: { stroke: "#E24B4A", strokeWidth: 1.5, strokeOpacity: 0.7 },
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
        fill: "var(--sg-text-muted)",
        fontFamily: "var(--font-sans, system-ui)",
      },
      labelBgStyle: {
        fill: "var(--sg-bg-primary)",
        fillOpacity: 0.85,
      },
      labelBgPadding: [4, 6],
      labelBgBorderRadius: 4,
    }));

    setEdges(builtEdges);
  }, [balances, transactions, setNodes, setEdges]);

  useEffect(() => {
    buildGraph();
  }, [buildGraph]);

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="sg-wrap">
      {/* Header */}
      <div className="sg-header">
        <div>
          <h3 className="sg-title">
            <i className="ti ti-arrows-exchange" aria-hidden="true" />
            Settlement flow
          </h3>
          <p className="sg-subtitle">Optimised payment routes for this trip</p>
        </div>
        <div className="sg-legend">
          <span className="sg-leg-item">
            <span className="sg-leg-dot sg-leg-dot--pay" />
            Pays
          </span>
          <span className="sg-leg-item">
            <span className="sg-leg-dot sg-leg-dot--recv" />
            Receives
          </span>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="sg-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="var(--sg-border)"
            gap={20}
            size={1}
            style={{ opacity: 0.4 }}
          />
          <Controls
            showInteractive={false}
            className="sg-controls"
          />
        </ReactFlow>
      </div>

      {/* Summary strip */}
      <div className="sg-summary">
        <div className="sg-sum-item">
          <p className="sg-sum-label">Settlements</p>
          <p className="sg-sum-value">{transactions.length}</p>
        </div>
        <div className="sg-sum-item">
          <p className="sg-sum-label">Total amount</p>
          <p className="sg-sum-value">{fmt(totalAmount)}</p>
        </div>
        <div className="sg-sum-item">
          <p className="sg-sum-label">Participants</p>
          <p className="sg-sum-value">{balances.length}</p>
        </div>
      </div>
    </div>
  );
}
