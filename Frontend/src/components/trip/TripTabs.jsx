import "./TripTabs.css";

export default function TripTabs({
  activeTab,
  setActiveTab
}) {
  const tabs = [
    {
      key: "overview",
      label: "Overview"
    },
    {
      key: "members",
      label: "Members"
    },
    {
      key: "planner",
      label: "Planner"
    },
    {
      key: "recommendations",
      label: "Recommendations"
    },
    {
      key: "expenses",
      label: "Expenses"
    },
    {
      key: "notes",
      label: "Notes"
    }
  ];

  return (
    <div className="trip-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`trip-tab-btn ${
            activeTab === tab.key
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab(tab.key)
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}