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
var DEFAULT_MIN_WIDTH = 280;
var DEFAULT_INLINE_WIDTH = {
  min: DEFAULT_MIN_WIDTH,
  max: DEFAULT_MAX_WIDTH,
  sourceScale: 2.5
};
var DEFAULT_GUTTER = 16;
var DEFAULT_DURATION_BY_VARIANT = {
  success: 4e3,
  info: 6e3
};
var INLINE_GAP = 6;
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
function getDefaultDuration(variant) {
  return DEFAULT_DURATION_BY_VARIANT[variant] ?? null;
}
function resolveDuration(item, explicitDuration) {
  return explicitDuration === void 0 ? getDefaultDuration(item.variant) : explicitDuration;
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
  scheduleDismiss(item.id, resolveDuration(item, input.duration));
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
      const updated = nextItems.find((existing) => existing.id === item.id);
      if (updated && (patch.duration !== void 0 || patch.variant !== void 0)) {
        scheduleDismiss(item.id, resolveDuration(updated, patch.duration));
      }
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
function finitePositive(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
function clampWidth(width, minWidth, maxWidth, viewportWidth, gutter) {
  const availableWidth = Math.max(0, viewportWidth - gutter * 2);
  const itemMaxWidth = Math.max(1, maxWidth);
  const preferredMinWidth = Math.min(Math.max(1, minWidth), itemMaxWidth, availableWidth || itemMaxWidth);
  return Math.max(preferredMinWidth, Math.min(Math.max(1, width), itemMaxWidth, availableWidth || itemMaxWidth));
}
function getInlineSize(rect, options, fallbackMinWidth, fallbackMaxWidth, viewportWidth, gutter) {
  const minWidth = finitePositive(options?.min, fallbackMinWidth);
  const maxWidth = finitePositive(options?.max, fallbackMaxWidth);
  const sourceScale = finitePositive(options?.sourceScale, DEFAULT_INLINE_WIDTH.sourceScale);
  const width = clampWidth(rect.width * sourceScale, minWidth, maxWidth, viewportWidth, gutter);
  const left = Math.min(Math.max(gutter, rect.left + rect.width / 2 - width / 2), Math.max(gutter, viewportWidth - width - gutter));
  return { left, width };
}
function getDocumentPosition(item, options) {
  if (typeof window === "undefined") return { top: options.gutter, left: options.gutter, width: options.maxWidth };
  const viewportWidth = window.innerWidth || options.maxWidth + options.gutter * 2;
  const width = clampWidth(options.maxWidth, options.minWidth, options.maxWidth, viewportWidth, options.gutter);
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  return {
    top: scrollY + options.gutter,
    left: scrollX + Math.max(options.gutter, viewportWidth - width - options.gutter),
    width
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
function getInlinePlacement(placement) {
  return placement === "bottom" || placement === "after" || placement === "below" ? "after" : "before";
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
  width,
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
      style: { ...item.style, maxWidth: width },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "quoterm__icon", "aria-hidden": "true", children: icon }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__body", children: [
          command ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__command", children: [
            "$ ",
            command
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "quoterm__quote", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "quoterm__prompt", "aria-hidden": "true", children: [
              ">",
              " "
            ] }),
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
  zIndex,
  maxWidth,
  minWidth,
  inlineWidth,
  gutter,
  renderIcon,
  formatCommand
}) {
  const [rect, setRect] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = item.sourceElement;
    if (!el || typeof window === "undefined") return;
    let frame = null;
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
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
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
  const widthOptions = { ...inlineWidth };
  if (item.minWidth !== void 0) widthOptions.min = item.minWidth;
  const inlineSize = getInlineSize(rect, widthOptions, minWidth, maxWidth, viewportWidth, gutter);
  const posStyle = placement === "after" ? { top: rect.bottom + INLINE_GAP } : { bottom: vh - rect.top + INLINE_GAP };
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        className: "quoterm-inline-root quoterm-inline-slot",
        "data-quoterm": "inline-slot",
        "data-quoterm-slot": "inline",
        "data-quoterm-placement": placement,
        style: { position: "fixed", left: inlineSize.left, width: inlineSize.width, zIndex, ...posStyle },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuotermItem, { item, theme, width: inlineSize.width, renderIcon, formatCommand })
      }
    ),
    document.body
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
  renderIcon,
  formatCommand
}) {
  if (typeof document === "undefined") return null;
  const target = portalTarget ?? document.body;
  const position = getDocumentPosition(item, { gutter, maxWidth, minWidth: item.minWidth ?? minWidth });
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "quoterm-fallback-root", "data-quoterm": "fallback-slot", style: { top: position.top, left: position.left, zIndex }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuotermItem, { item, theme, width: position.width, renderIcon, formatCommand }) }),
    target
  );
}
function QuotermHost({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  gutter = DEFAULT_GUTTER,
  maxWidth = DEFAULT_MAX_WIDTH,
  minWidth = DEFAULT_MIN_WIDTH,
  inlineWidth,
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
        zIndex,
        maxWidth,
        minWidth: inlineWidth?.min ?? minWidth,
        inlineWidth: inlineWidth ?? DEFAULT_INLINE_WIDTH,
        gutter,
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
        minWidth,
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
