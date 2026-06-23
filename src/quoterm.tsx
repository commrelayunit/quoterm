import * as React from "react";
import { createPortal } from "react-dom";

export type QuotermVariant = "success" | "warning" | "error" | "info";
export type QuotermPlacement = "auto" | "top" | "bottom";
export type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;

export interface QuotermInput {
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  variant?: QuotermVariant;
  command?: string;
  source?: QuotermSource;
  sourceRect?: DOMRect | null;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  dismissLabel?: string;
  placement?: QuotermPlacement;
  role?: "status" | "alert";
  ariaLive?: "off" | "polite" | "assertive";
  id?: string;
}

export interface QuotermState extends Omit<QuotermInput, "source"> {
  id: string;
  open: boolean;
  createdAt: number;
  sourceRect: DOMRect | null;
  variant: QuotermVariant;
}

export interface QuotermSnapshot {
  items: QuotermState[];
}

export interface QuotermDismiss {
  id: string;
  dismiss: () => void;
  update: (patch: Partial<QuotermInput>) => void;
}

export type QuotermApi = QuotermDismiss;

export interface QuotermHostProps {
  className?: string;
  maxItems?: number;
  gutter?: number;
  maxWidth?: number;
  zIndex?: number;
  portalTarget?: Element | DocumentFragment | null;
  renderIcon?: (variant: QuotermVariant) => React.ReactNode;
  formatCommand?: (variant: QuotermVariant, item: QuotermState) => string;
}

type Listener = () => void;

const DEFAULT_DURATION = 6500;
const DEFAULT_MAX_ITEMS = 3;
const DEFAULT_MAX_WIDTH = 360;
const DEFAULT_GUTTER = 16;

let nextId = 0;
let snapshot: QuotermSnapshot = { items: [] };
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const defaultIcons: Record<QuotermVariant, string> = {
  success: "✓",
  warning: "!",
  error: "×",
  info: "i",
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: QuotermSnapshot) {
  snapshot = next;
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function serverSnapshot(): QuotermSnapshot {
  return { items: [] };
}

function genId() {
  nextId = (nextId + 1) % Number.MAX_SAFE_INTEGER;
  return `qt_${nextId}`;
}

function isElement(value: unknown): value is Element {
  return typeof Element !== "undefined" && value instanceof Element;
}

function isDomRect(value: unknown): value is DOMRect {
  return typeof DOMRect !== "undefined" && value instanceof DOMRect;
}

function getSourceRect(source?: QuotermSource): DOMRect | null {
  if (source === null) return null;
  const candidate = source ?? (typeof document !== "undefined" ? document.activeElement : null);

  if (!candidate) return null;
  if (isDomRect(candidate)) return candidate;
  if (isElement(candidate)) return candidate.getBoundingClientRect();
  if (typeof candidate === "object" && "current" in candidate && isElement(candidate.current)) {
    return candidate.current.getBoundingClientRect();
  }
  if (candidate instanceof EventTarget && isElement(candidate)) return candidate.getBoundingClientRect();

  return null;
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

function scheduleDismiss(id: string, duration?: number) {
  clearTimer(id);
  if (typeof window === "undefined") return;
  if (duration === undefined || duration <= 0 || !Number.isFinite(duration)) return;

  timers.set(
    id,
    window.setTimeout(() => {
      dismissQuoterm(id);
    }, duration),
  );
}

function normalizeItem(input: QuotermInput): QuotermState {
  const { source, sourceRect, ...rest } = input;
  return {
    ...rest,
    id: input.id ?? genId(),
    variant: input.variant ?? "success",
    open: true,
    createdAt: Date.now(),
    sourceRect: sourceRect ?? getSourceRect(source),
  };
}

export function getQuotermsSnapshot(): QuotermSnapshot {
  return snapshot;
}

export function dismissQuoterm(id?: string) {
  if (id) {
    clearTimer(id);
    setSnapshot({ items: snapshot.items.filter((item) => item.id !== id) });
    return;
  }

  snapshot.items.forEach((item) => clearTimer(item.id));
  setSnapshot({ items: [] });
}

export function quoterm(input: QuotermInput): QuotermApi {
  const item = normalizeItem(input);
  const limit = Math.max(1, DEFAULT_MAX_ITEMS);

  setSnapshot({ items: [item, ...snapshot.items.filter((existing) => existing.id !== item.id)].slice(0, limit) });
  scheduleDismiss(item.id, input.duration ?? DEFAULT_DURATION);

  return {
    id: item.id,
    dismiss: () => dismissQuoterm(item.id),
    update: (patch) => {
      const nextItem = { ...item, ...patch, sourceRect: patch.sourceRect ?? getSourceRect(patch.source) ?? item.sourceRect };
      setSnapshot({ items: snapshot.items.map((existing) => (existing.id === item.id ? nextItem : existing)) });
      if (patch.duration !== undefined) scheduleDismiss(item.id, patch.duration);
    },
  };
}

export function useQuoterm() {
  const currentSnapshot = React.useSyncExternalStore(subscribe, getQuotermsSnapshot, serverSnapshot);
  return React.useMemo(
    () => ({
      items: currentSnapshot.items,
      quoterm,
      dismiss: dismissQuoterm,
    }),
    [currentSnapshot],
  );
}

function useViewportTick(active: boolean) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const update = () => setTick((value) => value + 1);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active]);
}

function getPosition(item: QuotermState, options: Required<Pick<QuotermHostProps, "gutter" | "maxWidth">>) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter };

  const width = Math.min(options.maxWidth, window.innerWidth - options.gutter * 2);
  const fallbackTop = Math.max(options.gutter, window.innerHeight - 150);
  const fallbackLeft = Math.max(options.gutter, window.innerWidth - width - options.gutter);

  if (!item.sourceRect) return { top: fallbackTop, left: fallbackLeft };

  const belowTop = item.sourceRect.bottom + 10;
  const aboveTop = item.sourceRect.top - 106;
  const canFitBelow = belowTop + 106 < window.innerHeight - options.gutter;
  const placement = item.placement ?? "auto";
  const top = placement === "bottom" || (placement === "auto" && canFitBelow) ? belowTop : Math.max(options.gutter, aboveTop);
  const centeredLeft = item.sourceRect.left + item.sourceRect.width / 2 - width / 2;
  const left = Math.min(Math.max(options.gutter, centeredLeft), window.innerWidth - width - options.gutter);

  return { top, left };
}

function getRole(item: QuotermState) {
  return item.role ?? (item.variant === "error" || item.variant === "warning" ? "alert" : "status");
}

function getAriaLive(item: QuotermState) {
  return item.ariaLive ?? (item.variant === "error" || item.variant === "warning" ? "assertive" : "polite");
}

function defaultFormatCommand(variant: QuotermVariant, item: QuotermState) {
  return item.command ?? `quoterm --${variant}`;
}

export function QuotermHost({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  gutter = DEFAULT_GUTTER,
  maxWidth = DEFAULT_MAX_WIDTH,
  zIndex = 1000,
  portalTarget,
  renderIcon,
  formatCommand = defaultFormatCommand,
}: QuotermHostProps) {
  const { items } = useQuoterm();
  const visibleItems = items.slice(0, Math.max(1, maxItems));
  useViewportTick(visibleItems.length > 0);

  if (typeof document === "undefined" || visibleItems.length === 0) return null;

  const target = portalTarget ?? document.body;

  return createPortal(
    <div className={["quoterm-root", className].filter(Boolean).join(" ")} style={{ zIndex }}>
      {visibleItems.map((item) => {
        const position = getPosition(item, { gutter, maxWidth });
        const command = formatCommand(item.variant, item);
        const icon = renderIcon?.(item.variant) ?? defaultIcons[item.variant];

        return (
          <section
            key={item.id}
            role={getRole(item)}
            aria-live={getAriaLive(item)}
            aria-atomic="true"
            data-quoterm="item"
            data-variant={item.variant}
            className={["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" ")}
            style={{ ...item.style, top: position.top, left: position.left, maxWidth }}
          >
            <div className="quoterm__row">
              <span className="quoterm__icon" aria-hidden="true">
                {icon}
              </span>
              <div className="quoterm__body">
                <div className="quoterm__command">
                  <span aria-hidden="true">$ {command}</span>
                  <span className="quoterm__sr-only">{item.variant}: </span>
                </div>
                {item.title ? <div className="quoterm__title">{item.title}</div> : null}
                {item.message ?? item.description ? (
                  <div className="quoterm__message">{item.message ?? item.description}</div>
                ) : null}
              </div>
              <button
                type="button"
                className="quoterm__dismiss"
                aria-label={item.dismissLabel ?? "Dismiss feedback"}
                onClick={() => dismissQuoterm(item.id)}
              >
                ×
              </button>
            </div>
          </section>
        );
      })}
    </div>,
    target,
  );
}
