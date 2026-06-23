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
  setSnapshot({ items: [item, ...snapshot.items.filter((existing) => existing.id !== item.id)] });
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
function getDocumentPosition(item, options) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter, maxWidth: options.maxWidth };
  const viewportWidth = window.innerWidth || options.maxWidth + options.gutter * 2;
  const maxWidth = Math.min(options.maxWidth, viewportWidth - options.gutter * 2);
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  return {
    top: scrollY + options.gutter,
    left: scrollX + Math.max(options.gutter, viewportWidth - maxWidth - options.gutter),
    maxWidth
  };
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
function QuotermItem({
  item,
  theme,
  maxWidth,
  renderIcon,
  formatCommand
}) {
  const command = formatCommand(item.variant, item);
  const icon = renderIcon?.(item.variant) ?? defaultIcons[item.variant];
  const primary = getPrimaryMessage(item);
  const details = getDetailMessages(item);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "section",
    {
      role: getRole(item),
      "aria-live": getAriaLive(item),
      "aria-atomic": "true",
      "data-quoterm": "item",
      "data-variant": item.variant,
      "data-theme": theme,
      className: ["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" "),
      style: { ...item.style, maxWidth },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "quoterm__icon", "aria-hidden": "true", children: icon }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__body", children: [
          command ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__command", children: [
            "$ ",
            command
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__quote", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "> " }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "quoterm__variant", children: [
              item.variant,
              ": "
            ] }),
            primary
          ] }),
          details.map((detail, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "quoterm__detail", children: detail }, index))
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
    }
  );
}
function InlineQuotermPortal({
  item,
  theme,
  maxWidth,
  renderIcon,
  formatCommand
}) {
  const [container] = React.useState(() => typeof document === "undefined" ? null : document.createElement("div"));
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
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuotermItem, { item, theme, maxWidth, renderIcon, formatCommand }),
    container
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
  formatCommand
}) {
  if (typeof document === "undefined") return null;
  const target = portalTarget ?? document.body;
  const position = getDocumentPosition(item, { gutter, maxWidth });
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "quoterm-fallback-root", "data-quoterm": "fallback-slot", style: { top: position.top, left: position.left, zIndex }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuotermItem, { item, theme, maxWidth: position.maxWidth, renderIcon, formatCommand }) }),
    target
  );
}
function QuotermHost({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  gutter = DEFAULT_GUTTER,
  maxWidth = DEFAULT_MAX_WIDTH,
  zIndex = 1e3,
  theme = "auto",
  portalTarget,
  renderIcon,
  formatCommand = defaultFormatCommand
}) {
  const { items } = useQuoterm();
  const visibleItems = items.slice(0, Math.max(1, maxItems));
  if (typeof document === "undefined" || visibleItems.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: visibleItems.map((item) => {
    const itemTheme = item.theme ?? theme;
    const content = item.sourceElement ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      InlineQuotermPortal,
      {
        item,
        theme: itemTheme,
        maxWidth,
        renderIcon,
        formatCommand
      },
      item.id
    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      FallbackQuotermPortal,
      {
        item,
        theme: itemTheme,
        gutter,
        maxWidth,
        zIndex,
        portalTarget,
        renderIcon,
        formatCommand
      },
      item.id
    );
    return className ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className, children: content }) : content;
  }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QuotermHost,
  dismissQuoterm,
  getQuotermsSnapshot,
  quoterm,
  useQuoterm
});
