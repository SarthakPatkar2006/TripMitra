import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType
} from "reactflow";

import "reactflow/dist/style.css";

export default function ExpenseFlowGraph({
  balances = [],
  settlements = []
}) {
  const [
    activeEdges,
    setActiveEdges
  ] = useState([]);

  const [
    simulationRunning,
    setSimulationRunning
  ] = useState(false);

  useEffect(() => {
    if (
      !simulationRunning ||
      settlements.length === 0
    ) {
      return;
    }

    let index = 0;

    const timer =
      setInterval(() => {
        if (
          index >=
          settlements.length
        ) {
          clearInterval(timer);
          setSimulationRunning(
            false
          );
          return;
        }

        setActiveEdges(
          (prev) => [
            ...prev,
            `e-${index}`
          ]
        );

        index++;
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    simulationRunning,
    settlements
  ]);

  const { nodes, edges } =
    useMemo(() => {
      const generatedNodes = [];
      const generatedEdges = [];

      const radius = 300;
      const centerX = 500;
      const centerY = 350;

      balances.forEach(
        (user, index) => {
          const angle =
            (index /
              Math.max(
                balances.length,
                1
              )) *
            Math.PI *
            2;

          const x =
            centerX +
            radius *
              Math.cos(angle);

          const y =
            centerY +
            radius *
              Math.sin(angle);

          const initials =
            user.name
              ?.split(" ")
              .map(
                (w) => w[0]
              )
              .join("")
              .slice(0, 2) ||
            "U";

          generatedNodes.push({
            id: user.userId,

            position: {
              x,
              y
            },

            data: {
              label: (
                <div className="flow-node">

                  <div
                    className={
                      user.amount >= 0
                        ? "flow-avatar positive"
                        : "flow-avatar negative"
                    }
                  >
                    {initials}
                  </div>

                  <h4>
                    {user.name}
                  </h4>

                  <p>
                    {user.amount >= 0
                      ? "+"
                      : "-"}
                    ₹
                    {Math.abs(
                      user.amount
                    ).toLocaleString()}
                  </p>

                </div>
              )
            },

            style: {
              width: 220,
              height: 180,
              borderRadius: 30,
              border:
                "1px solid #e2e8f0",
              background:
                "white",
              boxShadow:
                "0 20px 45px rgba(0,0,0,0.12)"
            }
          });
        }
      );

      settlements.forEach(
        (
          settlement,
          index
        ) => {
          generatedEdges.push({
            id: `e-${index}`,

            source:
              settlement.from,

            target:
              settlement.to,

            animated:
              activeEdges.includes(
                `e-${index}`
              ),

            label:
              `₹${settlement.amount}`,

            markerEnd: {
              type:
                MarkerType.ArrowClosed
            },

            style: {
              stroke:
                activeEdges.includes(
                  `e-${index}`
                )
                  ? "#10b981"
                  : "#94a3b8",

              strokeWidth:
                activeEdges.includes(
                  `e-${index}`
                )
                  ? 6
                  : 3
            },

            labelStyle: {
              fill:
                "#0f172a",
              fontWeight:
                700
            }
          });
        }
      );

      return {
        nodes:
          generatedNodes,
        edges:
          generatedEdges
      };
    }, [
      balances,
      settlements,
      activeEdges
    ]);

  return (
    <div className="expense-panel">

      <div className="flow-header">

        <h3>
          💸 Cash Flow Network
        </h3>

        {settlements.length >
          0 && (
          <button
            className="simulate-btn"
            onClick={() => {
              setActiveEdges(
                []
              );

              setSimulationRunning(
                true
              );
            }}
          >
            ▶ Simulate
          </button>
        )}

      </div>

      <div
        style={{
          height: 750
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>

    </div>
  );
}