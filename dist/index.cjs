"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  QuotermHost: () => QuotermHost,
  dismissQuoterm: () => dismissQuoterm,
  getQuotermsSnapshot: () => getQuotermsSnapshot,
  quoterm: () => quoterm,
  useQuoterm: () => useQuoterm
});
module.exports = __toCommonJS(index_exports);

// src/quoterm.tsx
var React = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var import_jsx_runtime = require("react/jsx-runtime");
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
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ["quoterm-root", className].filter(Boolean).join(" "), style: { zIndex }, children: visibleItems.map((item) => {
      const position = getPosition(item, { gutter, maxWidth });
      const command = formatCommand(item.variant, item);
      const icon = renderIcon?.(item.variant) ?? defaultIcons[item.variant];
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "section",
        {
          role: getRole(item),
          "aria-live": getAriaLive(item),
          "aria-atomic": "true",
          "data-quoterm": "item",
          "data-variant": item.variant,
          className: ["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" "),
          style: { ...item.style, top: position.top, left: position.left, maxWidth },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "quoterm__icon", "aria-hidden": "true", children: icon }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__command", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { "aria-hidden": "true", children: [
                  "$ ",
                  command
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "quoterm__sr-only", children: [
                  item.variant,
                  ": "
                ] })
              ] }),
              item.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "quoterm__title", children: item.title }) : null,
              item.message ?? item.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "quoterm__message", children: item.message ?? item.description }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QuotermHost,
  dismissQuoterm,
  getQuotermsSnapshot,
  quoterm,
  useQuoterm
});
