import { useEffect, useId, useState, type Ref } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { searchAddress } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/api";

interface Props {
  kind: "pickup" | "dropoff";
  label: string;
  value: Place | null;
  onSelect: (p: Place) => void;
  onClear: () => void;
  onFocus?: () => void;
  active?: boolean;
  disabled?: boolean;
  /** External error, e.g. from the API */
  error?: string | null | undefined;
  inputRef?: Ref<HTMLInputElement> | undefined;
}

export function LocationInput({ kind, label, value, onSelect, onClear, onFocus, active, disabled, error, inputRef }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(value?.address ?? "");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [blurError, setBlurError] = useState<string | null>(null);
  const shownError = error ?? blurError;
  const errId = `${id}-err`;

  useEffect(() => setText(value?.address ?? ""), [value?.address]);

  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim()), 500);
    return () => clearTimeout(t);
  }, [text]);

  const enabled = open && term.length >= 3 && term !== value?.address;
  const { data, isFetching } = useQuery({
    queryKey: ["nominatim", term],
    queryFn: ({ signal }) => searchAddress(term, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
  const results = enabled ? (data ?? []) : [];
  const showList = enabled && (results.length > 0 || (!isFetching && data !== undefined));

  const choose = (i: number) => {
    const r = results[i];
    if (!r) return;
    onSelect({ lat: r.lat, lon: r.lon, address: r.address });
    setText(r.address);
    setOpen(false);
    setBlurError(null);
  };

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={id} className="text-caption text-muted-foreground">{label}</label>
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-md border bg-card px-3 shadow-sm transition-colors ease-ui",
          active && "border-primary bg-primary-soft",
          shownError && "border-destructive bg-card",
        )}
      >
        <span
          aria-hidden
          className={cn("size-3 shrink-0 rounded-full", kind === "pickup" ? "bg-primary ring-2 ring-ink" : "bg-dropoff ring-2 ring-primary")}
        />
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-invalid={!!shownError}
          aria-describedby={shownError ? errId : undefined}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={kind === "pickup" ? "Search pickup address" : "Search dropoff address"}
          value={text}
          disabled={disabled}
          onFocus={() => {
            setOpen(true);
            onFocus?.();
          }}
          onBlur={(e) => {
            const v = e.target.value.trim();
            setTimeout(() => {
              setOpen(false);
              setBlurError(v && v !== value?.address ? "Select an address from the list or click the map" : null);
            }, 150);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); choose(highlight); }
            if (e.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 bg-transparent text-small outline-none placeholder:text-muted-foreground focus-visible:shadow-none focus-visible:outline-none"
        />
        {isFetching && enabled && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
        {text && !disabled && (
          <button
            type="button"
            onClick={() => { setText(""); setBlurError(null); onClear(); }}
            className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label={`Clear ${kind}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {shownError && (
        <p id={errId} className="text-small font-medium text-destructive">{shownError}</p>
      )}
      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-[1000] mt-1 max-h-64 overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-small text-muted-foreground">No NYC addresses found</li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => { e.preventDefault(); choose(i); }}
                onMouseEnter={() => setHighlight(i)}
                className={cn("cursor-pointer rounded-md px-3 py-2 text-small", i === highlight && "bg-primary-soft")}
              >
                {r.address}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
