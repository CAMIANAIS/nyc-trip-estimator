import { ClientOnly } from "@tanstack/react-router";
import { ArrowRight, Brain, Cpu, MapPinned, Monitor, Server, User } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MODEL_METRICS } from "@/lib/mock";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: User, label: "User" },
  { icon: Monitor, label: "React app" },
  { icon: Server, label: "FastAPI" },
  { icon: MapPinned, label: "Taxi zones + distance" },
  { icon: Brain, label: "ML models" },
  { icon: Cpu, label: "Prediction" },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <section className="max-w-2xl">
        <p className="text-caption text-muted-foreground">About the model</p>
        <h1 className="mt-2 text-display">Predicting NYC taxi fares and trip times</h1>
        <p className="mt-3 text-muted-foreground">
          We trained machine-learning models on NYC TLC yellow taxi trip records from February 2022 to estimate the
          total fare and the duration of a trip, given the pickup and dropoff zones, distance, time and passenger count.
        </p>
      </section>

      <section aria-labelledby="compare" className="rounded-lg border bg-card p-5 shadow-md">
        <h2 id="compare" className="text-h2">Model comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-small">
            <thead className="text-caption text-muted-foreground">
              <tr className="border-b">
                {["Model", "MAE fare ($)", "RMSE fare ($)", "MAE duration (min)", "Training time", "Inference time"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_METRICS.map((m) => (
                <tr key={m.model} className={cn("border-b last:border-0", m.selected && "bg-primary-soft font-semibold")}>
                  <th scope="row" className="px-3 py-2.5">
                    {m.model}
                    {m.selected && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Selected</span>}
                  </th>
                  <td className="px-3 py-2.5 tabular-nums">{m.maeFare.toFixed(2)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{m.rmseFare.toFixed(2)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{m.maeDuration.toFixed(1)}</td>
                  <td className="px-3 py-2.5">{m.trainingTime}</td>
                  <td className="px-3 py-2.5">{m.inferenceTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="mae" className="rounded-lg border bg-card p-5 shadow-md">
        <h2 id="mae" className="text-h2">Fare MAE per model</h2>
        <p className="text-small text-muted-foreground">Lower is better.</p>
        <div className="mt-4 h-72">
          <ClientOnly fallback={<div className="size-full animate-pulse rounded-md bg-muted" />}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MODEL_METRICS} margin={{ left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="model" tick={{ fontSize: 12, fill: "var(--ink-muted)" }} interval={0} />
                <YAxis tick={{ fontSize: 12, fill: "var(--ink-muted)" }} unit="$" />
                <Tooltip cursor={{ fill: "var(--taxi-yellow-soft)" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "MAE fare"]} />
                <Bar dataKey="maeFare" radius={[6, 6, 0, 0]}>
                  {MODEL_METRICS.map((m) => (
                    <Cell key={m.model} fill={m.selected ? "var(--taxi-yellow)" : "var(--ink-muted)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      </section>

      <section aria-labelledby="how" className="rounded-lg border bg-card p-5 shadow-md">
        <h2 id="how" className="text-h2">How it works</h2>
        <ol className="mt-5 flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex flex-col items-center gap-2 md:flex-1 md:flex-row">
              <div className="flex w-full flex-col items-center gap-2 rounded-lg border bg-secondary p-3 text-center">
                <span className={cn("grid size-10 place-items-center rounded-full", i === STEPS.length - 1 ? "bg-primary text-primary-foreground" : "bg-card")}>
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="text-small font-semibold">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="size-4 shrink-0 rotate-90 text-muted-foreground md:rotate-0" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
