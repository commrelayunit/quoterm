import * as React from "react";
import { createPortal } from "react-dom";

export type QuotermVariant = "success" | "warning" | "error" | "info";
export type QuotermPlacement = "auto" | "top" | "bottom" | "before" | "after" | "above" | "below";
export type QuotermTheme = "light" | "dark" | "auto";
export type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;
export type QuotermRenderMode = "overlay" | "inline";

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
  minWidth?: number;
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
  /** Shorthand for inlineWidth.min. */
  minWidth?: number;
  inlineWidth?: QuotermInlineWidthOptions;
  zIndex?: number;
  theme?: QuotermTheme;
  /**
   * overlay preserves the fixed-position anchored behavior with no layout shift.
   * inline inserts source-bound feedback before/after its source in document flow.
   * Defaults to overlay for backward compatibility.
   */
  renderMode?: QuotermRenderMode;
  /** Set false to hide terminal command, prompt, and variant prefix chrome. */
  showCommandChrome?: boolean;
  portalTarget?: Element | DocumentFragment | null;
  renderIcon?: (variant: QuotermVariant) => React.ReactNode;
  formatCommand?: (variant: QuotermVariant, item: QuotermState) => string;
}

export interface QuotermInlineWidthOptions {
  min?: number;
  max?: number;
  /** Multiplies the source width before clamping. Defaults to 2.5. */
  sourceScale?: number;
}

type Listener = () => void;

const DEFAULT_MAX_ITEMS = 3;
const DEFAULT_MAX_WIDTH = 360;
const DEFAULT_MIN_WIDTH = 280;
const DEFAULT_INLINE_WIDTH: Required<QuotermInlineWidthOptions> = {
  min: DEFAULT_MIN_WIDTH,
  max: DEFAULT_MAX_WIDTH,
  sourceScale: 2.5,
};
const DEFAULT_GUTTER = 16;
const DEFAULT_DURATION_BY_VARIANT: Partial<Record<QuotermVariant, number>> = {
  success: 4000,
  info: 6000,
};
const INLINE_GAP = 6;

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

function getDefaultDuration(variant: QuotermVariant) {
  return DEFAULT_DURATION_BY_VARIANT[variant] ?? null;
}

function resolveDuration(item: Pick<QuotermState, "variant" | "duration">, explicitDuration?: number | null) {
  return explicitDuration === undefined ? getDefaultDuration(item.variant) : explicitDuration;
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
  scheduleDismiss(item.id, resolveDuration(item, input.duration));

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
      const updated = nextItems.find((existing) => existing.id === item.id);
      if (updated && (patch.duration !== undefined || patch.variant !== undefined)) {
        scheduleDismiss(item.id, resolveDuration(updated, patch.duration));
      }
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

function finitePositive(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function clampWidth(width: number, minWidth: number, maxWidth: number, viewportWidth: number, gutter: number) {
  const availableWidth = Math.max(0, viewportWidth - gutter * 2);
  const itemMaxWidth = Math.max(1, maxWidth);
  const preferredMinWidth = Math.min(Math.max(1, minWidth), itemMaxWidth, availableWidth || itemMaxWidth);
  return Math.max(preferredMinWidth, Math.min(Math.max(1, width), itemMaxWidth, availableWidth || itemMaxWidth));
}

function getInlineSize(
  rect: DOMRect,
  options: QuotermInlineWidthOptions | undefined,
  fallbackMinWidth: number,
  fallbackMaxWidth: number,
  viewportWidth: number,
  gutter: number,
) {
  const minWidth = finitePositive(options?.min, fallbackMinWidth);
  const maxWidth = finitePositive(options?.max, fallbackMaxWidth);
  const sourceScale = finitePositive(options?.sourceScale, DEFAULT_INLINE_WIDTH.sourceScale);
  const width = clampWidth(rect.width * sourceScale, minWidth, maxWidth, viewportWidth, gutter);
  const left = Math.min(Math.max(gutter, rect.left + rect.width / 2 - width / 2), Math.max(gutter, viewportWidth - width - gutter));
  return { left, width };
}

function getDocumentPosition(item: QuotermState, options: Required<Pick<QuotermHostProps, "gutter" | "maxWidth" | "minWidth">>) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter, width: options.maxWidth };

  const viewportWidth = window.innerWidth || options.maxWidth + options.gutter * 2;
  const width = clampWidth(options.maxWidth, options.minWidth, options.maxWidth, viewportWidth, options.gutter);
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  return {
    top: scrollY + options.gutter,
    left: scrollX + Math.max(options.gutter, viewportWidth - width - options.gutter),
    width,
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

function getInlinePlacement(placement?: QuotermPlacement): "before" | "after" {
  return placement === "bottom" || placement === "after" || placement === "below" ? "after" : "before";
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
  width,
  showCommandChrome,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  width: number;
  showCommandChrome: boolean;
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
      style={{ ...item.style, maxWidth: width }}
    >
      <div className="quoterm__row">
        <span className="quoterm__icon" aria-hidden="true">
          {icon}
        </span>
        <div className="quoterm__body">
          {showCommandChrome && command ? <div className="quoterm__command">$ {command}</div> : null}
          <div className="quoterm__quote">
            {showCommandChrome ? (
              <>
                <span className="quoterm__prompt" aria-hidden="true">
                  &gt;{" "}
                </span>
                <span className="quoterm__variant">{item.variant}: </span>
              </>
            ) : null}
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

function OverlayQuotermPortal({
  item,
  theme,
  zIndex,
  maxWidth,
  minWidth,
  inlineWidth,
  gutter,
  showCommandChrome,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  zIndex: number;
  maxWidth: number;
  minWidth: number;
  inlineWidth: QuotermInlineWidthOptions | undefined;
  gutter: number;
  showCommandChrome: boolean;
  renderIcon: ((variant: QuotermVariant) => React.ReactNode) | undefined;
  formatCommand: (variant: QuotermVariant, item: QuotermState) => string;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useLayoutEffect(() => {
    const el = item.sourceElement;
    if (!el || typeof window === "undefined") return;

    let frame: number | null = null;
    const update = () => {
      frame = null;
      setRect(el.getBoundingClientRect());
    };
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true, capture: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            scheduleUpdate();
          });
    resizeObserver?.observe(el);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [item.sourceElement]);

  if (!rect || typeof document === "undefined") return null;

  const placement = getInlinePlacement(item.placement);
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : maxWidth + gutter * 2;
  const widthOptions: QuotermInlineWidthOptions = { ...inlineWidth };
  if (item.minWidth !== undefined) widthOptions.min = item.minWidth;
  const inlineSize = getInlineSize(rect, widthOptions, minWidth, maxWidth, viewportWidth, gutter);

  const posStyle: React.CSSProperties =
    placement === "after"
      ? { top: rect.bottom + INLINE_GAP }
      : { bottom: vh - rect.top + INLINE_GAP };

  return createPortal(
    <div
      className="quoterm-inline-root quoterm-inline-slot quoterm-overlay-slot"
      data-quoterm="inline-slot"
      data-quoterm-slot="inline"
      data-quoterm-placement={placement}
      data-quoterm-render-mode="overlay"
      style={{ position: "fixed", left: inlineSize.left, width: inlineSize.width, zIndex, ...posStyle }}
    >
      <QuotermItem
        item={item}
        theme={theme}
        width={inlineSize.width}
        showCommandChrome={showCommandChrome}
        renderIcon={renderIcon}
        formatCommand={formatCommand}
      />
    </div>,
    document.body,
  );
}

function InlineQuotermPortal({
  item,
  theme,
  maxWidth,
  minWidth,
  inlineWidth,
  gutter,
  showCommandChrome,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  maxWidth: number;
  minWidth: number;
  inlineWidth: QuotermInlineWidthOptions | undefined;
  gutter: number;
  showCommandChrome: boolean;
  renderIcon: ((variant: QuotermVariant) => React.ReactNode) | undefined;
  formatCommand: (variant: QuotermVariant, item: QuotermState) => string;
}) {
  const placement = getInlinePlacement(item.placement);
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useLayoutEffect(() => {
    const source = item.sourceElement;
    const parent = source?.parentNode;
    if (!source || !parent || typeof document === "undefined") return;

    const nextSlot = document.createElement("div");
    if (placement === "after") {
      parent.insertBefore(nextSlot, source.nextSibling);
    } else {
      parent.insertBefore(nextSlot, source);
    }
    setSlot(nextSlot);

    return () => {
      nextSlot.remove();
      setSlot((current) => (current === nextSlot ? null : current));
    };
  }, [item.sourceElement, placement]);

  React.useLayoutEffect(() => {
    const source = item.sourceElement;
    if (!source || typeof window === "undefined") return;

    let frame: number | null = null;
    const update = () => {
      frame = null;
      setRect(source.getBoundingClientRect());
    };
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            scheduleUpdate();
          });
    resizeObserver?.observe(source);

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [item.sourceElement]);

  if (!slot || !rect) return null;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : maxWidth + gutter * 2;
  const widthOptions: QuotermInlineWidthOptions = { ...inlineWidth };
  if (item.minWidth !== undefined) widthOptions.min = item.minWidth;
  const inlineSize = getInlineSize(rect, widthOptions, minWidth, maxWidth, viewportWidth, gutter);

  slot.className = "quoterm-inline-root quoterm-inline-slot";
  slot.dataset.quoterm = "inline-slot";
  slot.dataset.quotermSlot = "inline";
  slot.dataset.quotermPlacement = placement;
  slot.dataset.quotermRenderMode = "inline";
  slot.style.width = `${inlineSize.width}px`;
  slot.style.maxWidth = "100%";

  return createPortal(
    <QuotermItem
      item={item}
      theme={theme}
      width={inlineSize.width}
      showCommandChrome={showCommandChrome}
      renderIcon={renderIcon}
      formatCommand={formatCommand}
    />,
    slot,
  );
}

function FallbackQuotermPortal({
  item,
  theme,
  gutter,
  maxWidth,
  minWidth,
  zIndex,
  portalTarget,
  showCommandChrome,
  renderIcon,
  formatCommand,
}: {
  item: QuotermState;
  theme: QuotermTheme;
  gutter: number;
  maxWidth: number;
  minWidth: number;
  zIndex: number;
  portalTarget: Element | DocumentFragment | null | undefined;
  showCommandChrome: boolean;
  renderIcon: ((variant: QuotermVariant) => React.ReactNode) | undefined;
  formatCommand: (variant: QuotermVariant, item: QuotermState) => string;
}) {
  if (typeof document === "undefined") return null;

  const target = portalTarget ?? document.body;
  const position = getDocumentPosition(item, { gutter, maxWidth, minWidth: item.minWidth ?? minWidth });

  return createPortal(
    <div className="quoterm-fallback-root" data-quoterm="fallback-slot" style={{ top: position.top, left: position.left, zIndex }}>
      <QuotermItem
        item={item}
        theme={theme}
        width={position.width}
        showCommandChrome={showCommandChrome}
        renderIcon={renderIcon}
        formatCommand={formatCommand}
      />
    </div>,
    target,
  );
}

export function QuotermHost({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  gutter = DEFAULT_GUTTER,
  maxWidth = DEFAULT_MAX_WIDTH,
  minWidth = DEFAULT_MIN_WIDTH,
  inlineWidth,
  zIndex = 1000,
  theme = "auto",
  renderMode = "overlay",
  showCommandChrome = true,
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
          renderMode === "inline" ? (
            <InlineQuotermPortal
              key={item.id}
              item={item}
              theme={itemTheme}
              maxWidth={maxWidth}
              minWidth={inlineWidth?.min ?? minWidth}
              inlineWidth={inlineWidth ?? DEFAULT_INLINE_WIDTH}
              gutter={gutter}
              showCommandChrome={showCommandChrome}
              renderIcon={renderIcon}
              formatCommand={formatCommand}
            />
          ) : (
            <OverlayQuotermPortal
              key={item.id}
              item={item}
              theme={itemTheme}
              zIndex={zIndex}
              maxWidth={maxWidth}
              minWidth={inlineWidth?.min ?? minWidth}
              inlineWidth={inlineWidth ?? DEFAULT_INLINE_WIDTH}
              gutter={gutter}
              showCommandChrome={showCommandChrome}
              renderIcon={renderIcon}
              formatCommand={formatCommand}
            />
          )
        ) : (
          <FallbackQuotermPortal
            key={item.id}
            item={item}
            theme={itemTheme}
            gutter={gutter}
            maxWidth={maxWidth}
            minWidth={minWidth}
            zIndex={zIndex}
            portalTarget={portalTarget}
            showCommandChrome={showCommandChrome}
            renderIcon={renderIcon}
            formatCommand={formatCommand}
          />
        );

        return className ? <div className={className}>{content}</div> : content;
      })}
    </>
  );
}
