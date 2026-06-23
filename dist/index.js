// src/quoterm.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_MAX_ITEMS = 3;
var DEFAULT_MAX_WIDTH = 360;
var DEFAULT_GUTTER = 16;
var ESTIMATED_QUOTE_HEIGHT = 76;
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
function getSourceElement(source) {
  if (source === null) return null;
  const candidate = source ?? (typeof document !== "undefined" ? document.activeElement : null);
  if (!candidate || isDomRect(candidate)) return null;
  if (isElement(candidate)) return candidate;
  if (typeof candidate === "object" && "current" in candidate && isElement(candidate.current)) return candidate.current;
  if (candidate instanceof EventTarget && isElement(candidate)) return candidate;
  return null;
}
function getSourceRect(source) {
  if (source === null) return null;
  if (isDomRect(source)) return source;
  return getSourceElement(source)?.getBoundingClientRect() ?? null;
}
function clearTimer(id) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}
function scheduleDismiss(id, duration) {
  clearTimer(id);
  if (typeof window === "undefined") return;
  if (duration === void 0 || duration === null || duration <= 0 || !Number.isFinite(duration)) return;
  timers.set(
    id,
    window.setTimeout(() => {
      dismissQuoterm(id);
    }, duration)
  );
}
function normalizeItem(input) {
  const { source, sourceRect, ...rest } = input;
  const sourceElement = getSourceElement(source);
  return {
    ...rest,
    id: input.id ?? genId(),
    variant: input.variant ?? "success",
    open: true,
    createdAt: Date.now(),
    sourceElement,
    sourceRect: sourceRect ?? sourceElement?.getBoundingClientRect() ?? getSourceRect(source)
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
  scheduleDismiss(item.id, input.duration);
  return {
    id: item.id,
    dismiss: () => dismissQuoterm(item.id),
    update: (patch) => {
      const patchSourceElement = patch.source === void 0 ? void 0 : getSourceElement(patch.source);
      const nextItems = snapshot.items.map((existing) => {
        if (existing.id !== item.id) return existing;
        const sourceElement = patchSourceElement !== void 0 ? patchSourceElement : existing.sourceElement;
        return {
          ...existing,
          ...patch,
          sourceElement,
          sourceRect: patch.sourceRect ?? sourceElement?.getBoundingClientRect() ?? existing.sourceRect
        };
      });
      setSnapshot({ items: nextItems });
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
function getDocumentPosition(item, options) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter, maxWidth: options.maxWidth };
  const viewportWidth = window.innerWidth || options.maxWidth + options.gutter * 2;
  const maxWidth = Math.min(options.maxWidth, viewportWidth - options.gutter * 2);
  const sourceRect = item.sourceElement?.getBoundingClientRect() ?? item.sourceRect;
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  if (!sourceRect) {
    return {
      top: scrollY + options.gutter,
      left: scrollX + Math.max(options.gutter, viewportWidth - maxWidth - options.gutter),
      maxWidth
    };
  }
  const gap = 8;
  const topAbove = scrollY + sourceRect.top - ESTIMATED_QUOTE_HEIGHT - gap;
  const topBelow = scrollY + sourceRect.bottom + gap;
  const canFitAbove = sourceRect.top - ESTIMATED_QUOTE_HEIGHT - gap > options.gutter;
  const placement = item.placement ?? "auto";
  const top = placement === "bottom" || placement === "auto" && !canFitAbove ? topBelow : Math.max(scrollY + options.gutter, topAbove);
  const leftFromSource = scrollX + sourceRect.left;
  const maxLeft = scrollX + viewportWidth - maxWidth - options.gutter;
  const left = Math.min(Math.max(scrollX + options.gutter, leftFromSource), maxLeft);
  return { top, left, maxWidth };
}
function getRole(item) {
  return item.role ?? (item.variant === "error" || item.variant === "warning" ? "alert" : "status");
}
function getAriaLive(item) {
  return item.ariaLive ?? (item.variant === "error" || item.variant === "warning" ? "assertive" : "polite");
}
function defaultFormatCommand(_variant, item) {
  return item.command ?? "";
}
function getPrimaryMessage(item) {
  return item.title ?? item.message ?? item.description ?? "";
}
function getDetailMessages(item) {
  const details = [];
  if (item.title) {
    if (item.message) details.push(item.message);
    if (item.description) details.push(item.description);
  } else if (item.message && item.description) {
    details.push(item.description);
  }
  return details;
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
      const position = getDocumentPosition(item, { gutter, maxWidth });
      const command = formatCommand(item.variant, item);
      const icon = renderIcon?.(item.variant) ?? defaultIcons[item.variant];
      const primary = getPrimaryMessage(item);
      const details = getDetailMessages(item);
      return /* @__PURE__ */ jsx(
        "section",
        {
          role: getRole(item),
          "aria-live": getAriaLive(item),
          "aria-atomic": "true",
          "data-quoterm": "item",
          "data-variant": item.variant,
          className: ["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" "),
          style: { ...item.style, top: position.top, left: position.left, maxWidth: position.maxWidth },
          children: /* @__PURE__ */ jsxs("div", { className: "quoterm__row", children: [
            /* @__PURE__ */ jsx("span", { className: "quoterm__icon", "aria-hidden": "true", children: icon }),
            /* @__PURE__ */ jsxs("div", { className: "quoterm__body", children: [
              command ? /* @__PURE__ */ jsxs("div", { className: "quoterm__command", children: [
                "$ ",
                command
              ] }) : null,
              /* @__PURE__ */ jsxs("div", { className: "quoterm__quote", children: [
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "> " }),
                /* @__PURE__ */ jsxs("span", { className: "quoterm__variant", children: [
                  item.variant,
                  ": "
                ] }),
                primary
              ] }),
              details.map((detail, index) => /* @__PURE__ */ jsx("div", { className: "quoterm__detail", children: detail }, index))
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
