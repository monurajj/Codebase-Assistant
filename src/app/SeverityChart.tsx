 "use client";

import * as React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Issue = { severity: string };

export function SeverityChart({ issues }: { issues: Issue[] }) {
  const counts = React.useMemo(() => {
    const base = { low: 0, medium: 0, high: 0 };
    for (const issue of issues) {
      const s = issue.severity.toLowerCase();
      if (s === "high" || s === "medium" || s === "low") {
        base[s] += 1;
      }
    }
    return base;
  }, [issues]);

  const data = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Issues",
        data: [counts.low, counts.medium, counts.high],
        backgroundColor: [
          "rgba(16, 185, 129, 0.6)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(248, 113, 113, 0.8)",
        ],
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y} issues`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#a1a1aa", font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(63,63,70,0.7)" },
        ticks: { precision: 0, color: "#71717a", font: { size: 9 } },
      },
    },
  } as const;

  return (
    <div className="h-28">
      <Bar data={data} options={options} />
    </div>
  );
}

