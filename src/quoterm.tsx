import * as React from "react";
import { createPortal } from "react-dom";

export type QuotermVariant = "success" | "warning" | "error" | "info";
export type QuotermPlacement = "auto" | "top" | "bottom";
export type QuotermTheme = "light" | "dark" | "auto";
export type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;

export interface QuotermInput {
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  variant?: QuotermVariant;
  theme?: QuotermTheme;
  command?: string;
  source?: QuotermSource;
  sourceRect?: DOMRect | null;
  duration?: number | null;
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
  sourceElement: Element | null;
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
  theme?: QuotermTheme;
  portalTarget?: Element | DocumentFragment | null;
  renderIcon?: (variant: QuotermVariant) => React.ReactNode;
  formatCommand?: (variant: QuotermVariant, item: QuotermState) => string;
}

type Listener = () => void;

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

function getSourceElement(source?: QuotermSource): Element | null {
  if (source === null) return null;
  const candidate = source ?? (typeof document !== "undefined" ? document.activeElement : null);

  if (!candidate || isDomRect(candidate)) return null;
  if (isElement(candidate)) return candidate;
  if (typeof candidate === "object" && "current" in candidate && isElement(candidate.current)) return candidate.current;
  if (candidate instanceof EventTarget && isElement(candidate)) return candidate;

  return null;
}

function getSourceRect(source?: QuotermSource): DOMRect | null {
  if (source === null) return null;
  if (isDomRect(source)) return source;
  return getSourceElement(source)?.getBoundingClientRect() ?? null;
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

function scheduleDismiss(id: string, duration?: number | null) {
  clearTimer(id);
  if (typeof window === "undefined") return;
  if (duration === undefined || duration === null || duration <= 0 || !Number.isFinite(duration)) return;

  timers.set(
    id,
    window.setTimeout(() => {
      dismissQuoterm(id);
    }, duration),
  );
}

function normalizeItem(input: QuotermInput): QuotermState {
  const { source, sourceRect, ...rest } = input;
  const sourceElement = getSourceElement(source);

  return {
    ...rest,
    id: input.id ?? genId(),
    variant: input.variant ?? "success",
    open: true,
    createdAt: Date.now(),
    sourceElement,
    sourceRect: sourceRect ?? sourceElement?.getBoundingClientRect() ?? getSourceRect(source),
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
  setSnapshot({ items: [item, ...snapshot.items.filter((existing) => existing.id !== item.id)] });
  scheduleDismiss(item.id, input.duration);

  return {
    id: item.id,
    dismiss: () => dismissQuoterm(item.id),
    update: (patch) => {
      const patchSourceElement = patch.source === undefined ? undefined : getSourceElement(patch.source);
      const nextItems = snapshot.items.map((existing) => {
        if (existing.id !== item.id) return existing;
        const sourceElement = patchSourceElement !== undefined ? patchSourceElement : existing.sourceElement;
        return {
          ...existing,
          ...patch,
          sourceElement,
          sourceRect: patch.sourceRect ?? sourceElement?.getBoundingClientRect() ?? existing.sourceRect,
        };
      });
      setSnapshot({ items: nextItems });
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

function getDocumentPosition(item: QuotermState, options: Required<Pick<QuotermHostProps, "gutter" | "maxWidth">>) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter, maxWidth: options.maxWidth };

  const viewportWidth = window.innerWidth || options.maxWidth + options.gutter * 2;
  const maxWidth = Math.min(options.maxWidth, viewportWidth - options.gutter * 2);
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  return {
    top: scrollY + options.gutter,
    left: scrollX + Math.max(options.gutter, viewportWidth - maxWidth - options.gutter),
    maxWidth,
  };
}

function getRole(item: QuotermState) {
  return item.role ?? (item.variant === "error" || item.variant === "warning" ? "alert" : "status");
}

function getAriaLive(item: QuotermState) {
  return item.ariaLive ?? (item.variant === "error" || item.variant === "warning" ? "assertive" : "polite");
}

function defaultFormatCommand(_variant: QuotermVariant, item: QuotermState) {
  return item.command ?? "";
}

function getPrimaryMessage(item: QuotermState) {
  return item.title ?? item.message ?? item.description ?? "";
}

function getDetailMessages(item: QuotermState) {
  const details: React.ReactNode[] = [];
  if (item.title) {
    if (item.message) details.push(item.message);
    if (item.description) details.push(item.description);
  } else if (item.message && item.description) {
    details.push(item.description);
  }
  return details;
}

function QuotermItem({
  item,
  theme,
  maxWidth,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  maxWidth: number;
  renderIcon: ((variant: QuotermVariant) => React.ReactNode) | undefined;
  formatCommand: (variant: QuotermVariant, item: QuotermState) => string;
}) {
  const command = formatCommand(item.variant, item);
  const icon = renderIcon?.(item.variant) ?? defaultIcons[item.variant];
  const primary = getPrimaryMessage(item);
  const details = getDetailMessages(item);

  return (
    <section
      role={getRole(item)}
      aria-live={getAriaLive(item)}
      aria-atomic="true"
      data-quoterm="item"
      data-variant={item.variant}
      data-theme={theme}
      className={["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" ")}
      style={{ ...item.style, maxWidth }}
    >
      <div className="quoterm__row">
        <span className="quoterm__icon" aria-hidden="true">
          {icon}
        </span>
        <div className="quoterm__body">
          {command ? <div className="quoterm__command">$ {command}</div> : null}
          <div className="quoterm__quote">
            <span aria-hidden="true">&gt; </span>
            <span className="quoterm__variant">{item.variant}: </span>
            {primary}
          </div>
          {details.map((detail, index) => (
            <div className="quoterm__detail" key={index}>
              {detail}
            </div>
          ))}
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
}

function InlineQuotermPortal({
  item,
  theme,
  maxWidth,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  maxWidth: number;
  renderIcon: ((variant: QuotermVariant) => React.ReactNode) | undefined;
  formatCommand: (variant: QuotermVariant, item: QuotermState) => string;
}) {
  const [container] = React.useState(() => (typeof document === "undefined" ? null : document.createElement("div")));

  React.useLayoutEffect(() => {
    if (!container || !item.sourceElement?.parentNode) return;

    container.className = "quoterm-inline-slot";
    container.dataset.quoterm = "inline-slot";
    container.dataset.quotermSlot = "inline";
    item.sourceElement.parentNode.insertBefore(container, item.sourceElement);

    return () => {
      container.remove();
    };
  }, [container, item.sourceElement]);

  if (!container) return null;

  return createPortal(
    <QuotermItem item={item} theme={theme} maxWidth={maxWidth} renderIcon={renderIcon} formatCommand={formatCommand} />,
    container,
  );
}

function FallbackQuotermPortal({
  item,
  theme,
  gutter,
  maxWidth,
  zIndex,
  portalTarget,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  gutter: number;
  maxWidth: number;
  zIndex: number;
  portalTarget: Element | DocumentFragment | null | undefined;
  renderIcon: ((variant: QuotermVariant) => React.ReactNode) | undefined;
  formatCommand: (variant: QuotermVariant, item: QuotermState) => string;
}) {
  if (typeof document === "undefined") return null;

  const target = portalTarget ?? document.body;
  const position = getDocumentPosition(item, { gutter, maxWidth });

  return createPortal(
    <div className="quoterm-fallback-root" data-quoterm="fallback-slot" style={{ top: position.top, left: position.left, zIndex }}>
      <QuotermItem item={item} theme={theme} maxWidth={position.maxWidth} renderIcon={renderIcon} formatCommand={formatCommand} />
    </div>,
    target,
  );
}

export function QuotermHost({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  gutter = DEFAULT_GUTTER,
  maxWidth = DEFAULT_MAX_WIDTH,
  zIndex = 1000,
  theme = "auto",
  portalTarget,
  renderIcon,
  formatCommand = defaultFormatCommand,
}: QuotermHostProps) {
  const { items } = useQuoterm();
  const visibleItems = items.slice(0, Math.max(1, maxItems));

  if (typeof document === "undefined" || visibleItems.length === 0) return null;

  return (
    <>
      {visibleItems.map((item) => {
        const itemTheme = item.theme ?? theme;
        const content = item.sourceElement ? (
          <InlineQuotermPortal
            key={item.id}
            item={item}
            theme={itemTheme}
            maxWidth={maxWidth}
            renderIcon={renderIcon}
            formatCommand={formatCommand}
          />
        ) : (
          <FallbackQuotermPortal
            key={item.id}
            item={item}
            theme={itemTheme}
            gutter={gutter}
            maxWidth={maxWidth}
            zIndex={zIndex}
            portalTarget={portalTarget}
            renderIcon={renderIcon}
            formatCommand={formatCommand}
          />
        );

        return className ? <div className={className}>{content}</div> : content;
      })}
    </>
  );
}
