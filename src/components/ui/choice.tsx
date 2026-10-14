"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, isValid, parse, startOfMonth, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { controlClass } from "@/components/ui/styles";

export type ChoiceOption = { value: string; label: string; hint?: string };

type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function optionsFromChildren(children: React.ReactNode): ChoiceOption[] {
  const options: ChoiceOption[] = [];
  const visit = (nodes: React.ReactNode) => {
    ChildrenOf(nodes).forEach((child) => {
      if (!child || typeof child !== "object" || !("props" in child)) return;
      const element = child as React.ReactElement<{ value?: string | number; children?: React.ReactNode }>;
      if (element.type === "option") {
        options.push({ value: String(element.props.value ?? ""), label: textOf(element.props.children) });
        return;
      }
      if (element.props?.children) visit(element.props.children);
    });
  };
  visit(children);
  return options;
}

function ChildrenOf(nodes: React.ReactNode) {
  const list: React.ReactNode[] = [];
  const walk = (node: React.ReactNode) => {
    if (Array.isArray(node)) node.forEach(walk);
    else list.push(node);
  };
  walk(nodes);
  return list;
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

function useSyncedValue(value: string | undefined, defaultValue: string | undefined, fallback: string) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? fallback);
  const current = value !== undefined ? value : uncontrolled;
  return [current, setUncontrolled] as const;
}

function emitChange(onChange: ChangeHandler | undefined, name: string | undefined, next: string) {
  onChange?.({ target: { value: next, name: name ?? "" }, currentTarget: { value: next, name: name ?? "" } } as React.ChangeEvent<HTMLInputElement>);
}

function ChoiceList({
  options,
  value,
  active,
  listId,
  onActive,
  onPick,
  empty,
}: {
  options: ChoiceOption[];
  value: string;
  active: number;
  listId: string;
  onActive: (index: number) => void;
  onPick: (option: ChoiceOption) => void;
  empty: string;
}) {
  return (
    <div id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1" aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}>
      {options.length === 0 ? <p className="px-3 py-2 text-sm text-muted">{empty}</p> : null}
      {options.map((option, index) => (
        <button
          key={`${option.value}-${option.label}`}
          id={`${listId}-${index}`}
          type="button"
          role="option"
          aria-selected={option.value === value}
          className={cn(
            "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-[180ms]",
            index === active ? "bg-primary-soft text-ink" : "hover:bg-canvas",
            option.value === value && "text-primary",
          )}
          onMouseEnter={() => onActive(index)}
          onClick={() => onPick(option)}
        >
          <span className="min-w-0">
            <span className="block truncate">{option.label || "None"}</span>
            {option.hint ? <span className="block truncate text-xs text-muted">{option.hint}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

function moveActive(event: React.KeyboardEvent, count: number, active: number, setActive: (index: number) => void, pick: () => void) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActive(count === 0 ? 0 : (active + 1) % count);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setActive(count === 0 ? 0 : (active - 1 + count) % count);
  } else if (event.key === "Home") {
    event.preventDefault();
    setActive(0);
  } else if (event.key === "End") {
    event.preventDefault();
    setActive(Math.max(0, count - 1));
  } else if (event.key === "Enter") {
    event.preventDefault();
    pick();
  }
}

export function Select({
  children,
  options,
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  required,
  disabled,
  id,
  placeholder = "Select",
  ref,
  ...props
}: {
  children?: React.ReactNode;
  options?: ChoiceOption[];
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeHandler;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
} & Omit<React.AriaAttributes, "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext">) {
  const parsed = useMemo(() => options ?? optionsFromChildren(children), [options, children]);
  const [current, setUncontrolled] = useSyncedValue(value, defaultValue, parsed[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const buffer = useRef("");
  const label = parsed.find((option) => option.value === current)?.label;
  const labelledBy = props["aria-labelledby"];
  const ariaLabel = props["aria-label"];

  function changeOpen(next: boolean) {
    if (next) {
      const index = parsed.findIndex((option) => option.value === current);
      setActive(index >= 0 ? index : 0);
    }
    setOpen(next);
  }

  function commit(next: string) {
    setUncontrolled(next);
    emitChange(onChange, name, next);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      changeOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      changeOpen(false);
      return;
    }
    if (event.key.length === 1 && event.key !== " ") {
      buffer.current = `${buffer.current}${event.key}`.toLowerCase();
      window.setTimeout(() => {
        buffer.current = "";
      }, 500);
      const index = parsed.findIndex((option) => option.label.toLowerCase().startsWith(buffer.current));
      if (index >= 0) setActive(index);
      return;
    }
    moveActive(event, parsed.length, active, setActive, () => {
      const option = parsed[active];
      if (option) commit(option.value);
    });
  }

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <div className="relative min-w-0">
      <input ref={ref} className="sr-only" tabIndex={-1} name={name} value={current} required={required} aria-hidden onBlur={onBlur} onChange={(event) => commit(event.target.value)} />
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-required={required || undefined}
          aria-invalid={props["aria-invalid"]}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          className={cn(controlClass, "flex items-center justify-between gap-2 text-left", className)}
          onKeyDown={onKeyDown}
        >
          <span className={cn("truncate", !label && "text-muted")}>{label || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-56 rounded-[16px] border border-line bg-white p-0 shadow-[var(--shadow-lift)]"
          onKeyDown={onKeyDown}
        >
          <ChoiceList options={parsed} value={current} active={active} listId={listId} onActive={setActive} onPick={(option) => commit(option.value)} empty="No choices" />
        </Popover.Content>
      </Popover.Portal>
      </div>
    </Popover.Root>
  );
}

export function Combobox({
  options = [],
  lookup,
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  required,
  disabled,
  id,
  placeholder = "Search",
  emptyLabel,
  ref,
  ...props
}: {
  options?: ChoiceOption[];
  lookup?: "country" | "university" | "professor";
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeHandler;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  emptyLabel?: string;
  ref?: React.Ref<HTMLInputElement>;
} & Pick<React.AriaAttributes, "aria-label" | "aria-labelledby">) {
  const [current, setUncontrolled] = useSyncedValue(value, defaultValue, "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<ChoiceOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionValues = options.map((option) => option.value).join("\n");
  const remoteValues = remote.map((option) => option.value).join("\n");
  const known = useMemo(() => {
    const map = new Map<string, ChoiceOption>();
    for (const option of [...options, ...remote]) if (option.value) map.set(option.value, option);
    return map;
  }, [options, remote]);

  useEffect(() => {
    if (!lookup || !current) return;
    const seen = optionValues.split("\n").includes(current) || remoteValues.split("\n").includes(current);
    if (seen) return;
    const controller = new AbortController();
    fetch(`/api/lookups?kind=${lookup}&id=${encodeURIComponent(current)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { options: [] }))
      .then((body: { options?: ChoiceOption[] }) => {
        const match = body.options?.[0];
        if (!match) return;
        setRemote((items) => (items.some((item) => item.value === match.value) ? items : [match, ...items]));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [lookup, current, optionValues, remoteValues]);

  useEffect(() => {
    if (!open || !lookup) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      fetch(`/api/lookups?kind=${lookup}&q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("lookup failed");
          return response.json() as Promise<{ options?: ChoiceOption[] }>;
        })
        .then((body) => {
          setRemote((items) => {
            const next = body.options ?? [];
            const selected = items.find((item) => item.value === current);
            if (selected && !next.some((item) => item.value === selected.value)) return [selected, ...next];
            return next;
          });
          setStatus("idle");
          setActive(0);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setStatus("error");
        });
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, lookup, query, current]);

  const visible = useMemo(() => {
    const source = lookup ? remote : options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));
    return emptyLabel ? [{ value: "", label: emptyLabel }, ...source] : source;
  }, [lookup, remote, options, query, emptyLabel]);
  const selected = current ? known.get(current) : undefined;

  function commit(next: string) {
    setUncontrolled(next);
    emitChange(onChange, name, next);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="relative min-w-0">
      <input ref={(node) => assignRef(ref, node)} className="sr-only" tabIndex={-1} name={name} value={current} required={required} aria-hidden onBlur={onBlur} onChange={(event) => commit(event.target.value)} />
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required={required || undefined}
          aria-label={props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
          className={cn(controlClass, "flex items-center justify-between gap-2 text-left", className)}
        >
          <span className={cn("truncate", !selected && "text-muted")}>{selected?.label || emptyLabel || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-[var(--radix-popover-trigger-width)] min-w-64 rounded-[16px] border border-line bg-white shadow-[var(--shadow-lift)]" onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }}>
          <div className="border-b border-line p-2">
            <input
              ref={inputRef}
              value={query}
              aria-label={props["aria-label"] ? `Search ${props["aria-label"]}` : "Search choices"}
              aria-controls={listId}
              aria-autocomplete="list"
              placeholder={placeholder}
              className={cn(controlClass, "h-10")}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  return;
                }
                moveActive(event, visible.length, active, setActive, () => {
                  const option = visible[active];
                  if (option) commit(option.value);
                });
              }}
            />
          </div>
          {status === "loading" ? <p className="px-3 py-2 text-sm text-muted">Searching…</p> : null}
          {status === "error" ? <p className="px-3 py-2 text-sm text-danger" role="alert">Could not load matches.</p> : null}
          {status === "loading" ? null : <ChoiceList options={visible} value={current} active={active} listId={listId} onActive={setActive} onPick={(option) => commit(option.value)} empty="No matches" />}
        </Popover.Content>
      </Popover.Portal>
      </div>
    </Popover.Root>
  );
}

export function DateField({
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  required,
  disabled,
  id,
  min,
  max,
  ref,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange"> & {
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: ChangeHandler;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const initial = textValue(defaultValue);
  const [current, setUncontrolled] = useSyncedValue(value == null ? undefined : textValue(value), initial, "");
  const [open, setOpen] = useState(false);
  const parsed = parse(current, "yyyy-MM-dd", new Date());
  const valid = current !== "" && isValid(parsed);
  const [cursor, setCursor] = useState(valid ? parsed : new Date());
  const listId = useId();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  function commit(next: string) {
    setUncontrolled(next);
    emitChange(onChange, name, next);
    if (next) setOpen(false);
  }

  function allowed(day: Date) {
    const iso = format(day, "yyyy-MM-dd");
    if (min && iso < String(min)) return false;
    if (max && iso > String(max)) return false;
    return true;
  }

  function onGridKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, day: Date) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = addDays(day, delta);
    setCursor(next);
    const target = format(next, "yyyy-MM-dd");
    window.requestAnimationFrame(() => document.getElementById(`${listId}-${target}`)?.focus());
  }

  return (
    <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); if (next && valid) setCursor(parsed); }}>
      <div className="relative min-w-0">
      <input ref={ref} className="sr-only" tabIndex={-1} name={name} value={current} required={required} aria-hidden onBlur={onBlur} onChange={(event) => commit(event.target.value.slice(0, 10))} />
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : "false"}
          aria-controls={listId}
          aria-required={required || undefined}
          aria-label={props["aria-label"]}
          aria-labelledby={props["aria-labelledby"]}
          className={cn(controlClass, "flex items-center justify-between text-left", className)}
        >
          <span className={cn(!valid && "text-muted")}>{valid ? format(parsed, "d MMM yyyy") : "Choose a date"}</span>
          <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content id={listId} role="dialog" aria-label="Choose a date" align="start" sideOffset={6} className="z-50 w-[19rem] rounded-[16px] border border-line bg-white p-3 shadow-[var(--shadow-lift)]">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors duration-[180ms] hover:bg-canvas" aria-label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-sm font-medium">{format(cursor, "MMMM yyyy")}</p>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors duration-[180ms] hover:bg-canvas" aria-label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden>
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div role="grid" aria-label="Calendar" className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const selected = valid && isSameDay(day, parsed);
              return (
                <button
                  key={iso}
                  id={`${listId}-${iso}`}
                  type="button"
                  role="gridcell"
                  disabled={!allowed(day)}
                  aria-selected={selected}
                  aria-label={format(day, "d MMMM yyyy")}
                  className={cn(
                    "h-9 rounded-full text-sm transition-colors duration-[180ms] disabled:opacity-40",
                    !isSameMonth(day, cursor) && "text-muted",
                    selected ? "bg-primary text-white" : "hover:bg-primary-soft",
                    !selected && isToday(day) && "ring-1 ring-primary",
                  )}
                  onClick={() => commit(iso)}
                  onKeyDown={(event) => onGridKeyDown(event, day)}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          {!required ? <button type="button" className="mt-2 h-9 rounded-full px-3 text-sm text-muted transition-colors duration-[180ms] hover:bg-canvas hover:text-ink" onClick={() => commit("")}>Clear date</button> : null}
        </Popover.Content>
      </Popover.Portal>
      </div>
    </Popover.Root>
  );
}

function textValue(value: string | number | readonly string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] ?? "").slice(0, 10);
  if (value == null) return "";
  return String(value).slice(0, 10);
}
