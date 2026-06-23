// src/quoterm.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_DURATION = 6500;
var DEFAULT_MAX_ITEMS = 3;
var DEFAULT_MAX_WIDTH = 360;
var DEFAULT_GUTTER = 16;
var nextId = 0;
var snapshot = { items: [] };
var listeners = /* @__PURE__ */ new Set();
var timers = /* @__PURE__ */ new Map();
var defaultIcons = {
  success: "\u2713",
  warning: "!",
  error: "\xD7",
  info: "i"
};
function emit() {
  listeners.forEach((listener) => listener());
}
function setSnapshot(next) {
  snapshot = next;
  emit();
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function serverSnapshot() {
  return { items: [] };
}
function genId() {
  nextId = (nextId + 1) % Number.MAX_SAFE_INTEGER;
  return `qt_${nextId}`;
}
function isElement(value) {
  return typeof Element !== "undefined" && value instanceof Element;
}
function isDomRect(value) {
  return typeof DOMRect !== "undefined" && value instanceof DOMRect;
}
function getSourceRect(source) {
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
function clearTimer(id) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}
function scheduleDismiss(id, duration) {
  clearTimer(id);
  if (typeof window === "undefined") return;
  if (duration === void 0 || duration <= 0 || !Number.isFinite(duration)) return;
  timers.set(
    id,
    window.setTimeout(() => {
      dismissQuoterm(id);
    }, duration)
  );
}
function normalizeItem(input) {
  const { source, sourceRect, ...rest } = input;
  return {
    ...rest,
    id: input.id ?? genId(),
    variant: input.variant ?? "success",
    open: true,
    createdAt: Date.now(),
    sourceRect: sourceRect ?? getSourceRect(source)
  };
}
function getQuotermsSnapshot() {
  return snapshot;
}
function dismissQuoterm(id) {
  if (id) {
    clearTimer(id);
    setSnapshot({ items: snapshot.items.filter((item) => item.id !== id) });
    return;
  }
  snapshot.items.forEach((item) => clearTimer(item.id));
  setSnapshot({ items: [] });
}
function quoterm(input) {
  const item = normalizeItem(input);
  const limit = Math.max(1, DEFAULT_MAX_ITEMS);
  setSnapshot({ items: [item, ...snapshot.items.filter((existing) => existing.id !== item.id)].slice(0, limit) });
  scheduleDismiss(item.id, input.duration ?? DEFAULT_DURATION);
  return {
    id: item.id,
    dismiss: () => dismissQuoterm(item.id),
    update: (patch) => {
      const nextItem = { ...item, ...patch, sourceRect: patch.sourceRect ?? getSourceRect(patch.source) ?? item.sourceRect };
      setSnapshot({ items: snapshot.items.map((existing) => existing.id === item.id ? nextItem : existing) });
      if (patch.duration !== void 0) scheduleDismiss(item.id, patch.duration);
    }
  };
}
function useQuoterm() {
  const currentSnapshot = React.useSyncExternalStore(subscribe, getQuotermsSnapshot, serverSnapshot);
  return React.useMemo(
    () => ({
      items: currentSnapshot.items,
      quoterm,
      dismiss: dismissQuoterm
    }),
    [currentSnapshot]
  );
}
function useViewportTick(active) {
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
function getPosition(item, options) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter };
  const width = Math.min(options.maxWidth, window.innerWidth - options.gutter * 2);
  const fallbackTop = Math.max(options.gutter, window.innerHeight - 150);
  const fallbackLeft = Math.max(options.gutter, window.innerWidth - width - options.gutter);
  if (!item.sourceRect) return { top: fallbackTop, left: fallbackLeft };
  const belowTop = item.sourceRect.bottom + 10;
  const aboveTop = item.sourceRect.top - 106;
  const canFitBelow = belowTop + 106 < window.innerHeight - options.gutter;
  const placement = item.placement ?? "auto";
  const top = placement === "bottom" || placement === "auto" && canFitBelow ? belowTop : Math.max(options.gutter, aboveTop);
  const centeredLeft = item.sourceRect.left + item.sourceRect.width / 2 - width / 2;
  const left = Math.min(Math.max(options.gutter, centeredLeft), window.innerWidth - width - options.gutter);
  return { top, left };
}
function getRole(item) {
  return item.role ?? (item.variant === "error" || item.variant === "warning" ? "alert" : "status");
}
function getAriaLive(item) {
  return item.ariaLive ?? (item.variant === "error" || item.variant === "warning" ? "assertive" : "polite");
}
function defaultFormatCommand(variant, item) {
  return item.command ?? `quoterm --${variant}`;
}
function QuotermHost({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  gutter = DEFAULT_GUTTER,
  maxWidth = DEFAULT_MAX_WIDTH,
  zIndex = 1e3,
  portalTarget,
  renderIcon,
  formatCommand = defaultFormatCommand
}) {
  const { items } = useQuoterm();
  const visibleItems = items.slice(0, Math.max(1, maxItems));
  useViewportTick(visibleItems.length > 0);
  if (typeof document === "undefined" || visibleItems.length === 0) return null;
  const target = portalTarget ?? document.body;
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: ["quoterm-root", className].filter(Boolean).join(" "), style: { zIndex }, children: visibleItems.map((item) => {
      const position = getPosition(item, { gutter, maxWidth });
      const command = formatCommand(item.variant, item);
      const icon = renderIcon?.(item.variant) ?? defaultIcons[item.variant];
      return /* @__PURE__ */ jsx(
        "section",
        {
          role: getRole(item),
          "aria-live": getAriaLive(item),
          "aria-atomic": "true",
          "data-quoterm": "item",
          "data-variant": item.variant,
          className: ["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" "),
          style: { ...item.style, top: position.top, left: position.left, maxWidth },
          children: /* @__PURE__ */ jsxs("div", { className: "quoterm__row", children: [
            /* @__PURE__ */ jsx("span", { className: "quoterm__icon", "aria-hidden": "true", children: icon }),
            /* @__PURE__ */ jsxs("div", { className: "quoterm__body", children: [
              /* @__PURE__ */ jsxs("div", { className: "quoterm__command", children: [
                /* @__PURE__ */ jsxs("span", { "aria-hidden": "true", children: [
                  "$ ",
                  command
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "quoterm__sr-only", children: [
                  item.variant,
                  ": "
                ] })
              ] }),
              item.title ? /* @__PURE__ */ jsx("div", { className: "quoterm__title", children: item.title }) : null,
              item.message ?? item.description ? /* @__PURE__ */ jsx("div", { className: "quoterm__message", children: item.message ?? item.description }) : null
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "quoterm__dismiss",
                "aria-label": item.dismissLabel ?? "Dismiss feedback",
                onClick: () => dismissQuoterm(item.id),
                children: "\xD7"
              }
            )
          ] })
        },
        item.id
      );
    }) }),
    target
  );
}
export {
  QuotermHost,
  dismissQuoterm,
  getQuotermsSnapshot,
  quoterm,
  useQuoterm
};
