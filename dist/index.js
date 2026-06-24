// src/quoterm.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_MAX_ITEMS = 3;
var DEFAULT_MAX_WIDTH = 360;
var DEFAULT_GUTTER = 16;
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
  maxWidth,
  renderIcon,
  formatCommand
}) {
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
      "data-theme": theme,
      className: ["quoterm", `quoterm--${item.variant}`, item.className].filter(Boolean).join(" "),
      style: { ...item.style, maxWidth },
      children: /* @__PURE__ */ jsxs("div", { className: "quoterm__row", children: [
        /* @__PURE__ */ jsx("span", { className: "quoterm__icon", "aria-hidden": "true", children: icon }),
        /* @__PURE__ */ jsxs("div", { className: "quoterm__body", children: [
          command ? /* @__PURE__ */ jsxs("div", { className: "quoterm__command", children: [
            "$ ",
            command
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "quoterm__quote", children: [
            /* @__PURE__ */ jsxs("span", { className: "quoterm__prompt", "aria-hidden": "true", children: [
              ">",
              " "
            ] }),
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
    }
  );
}
function InlineQuotermPortal({
  item,
  theme,
  zIndex,
  renderIcon,
  formatCommand
}) {
  const [rect, setRect] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = item.sourceElement;
    if (!el) return;
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [item.sourceElement]);
  if (!rect || typeof document === "undefined") return null;
  const placement = getInlinePlacement(item.placement);
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  const posStyle = placement === "after" ? { top: rect.bottom + INLINE_GAP } : { bottom: vh - rect.top + INLINE_GAP };
  return createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "quoterm-inline-root",
        "data-quoterm": "inline-slot",
        "data-quoterm-placement": placement,
        style: { position: "fixed", left: rect.left, width: rect.width, zIndex, ...posStyle },
        children: /* @__PURE__ */ jsx(QuotermItem, { item, theme, maxWidth: rect.width, renderIcon, formatCommand })
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
  zIndex,
  portalTarget,
  renderIcon,
  formatCommand
}) {
  if (typeof document === "undefined") return null;
  const target = portalTarget ?? document.body;
  const position = getDocumentPosition(item, { gutter, maxWidth });
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: "quoterm-fallback-root", "data-quoterm": "fallback-slot", style: { top: position.top, left: position.left, zIndex }, children: /* @__PURE__ */ jsx(QuotermItem, { item, theme, maxWidth: position.maxWidth, renderIcon, formatCommand }) }),
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
  return /* @__PURE__ */ jsx(Fragment, { children: visibleItems.map((item) => {
    const itemTheme = item.theme ?? theme;
    const content = item.sourceElement ? /* @__PURE__ */ jsx(
      InlineQuotermPortal,
      {
        item,
        theme: itemTheme,
        zIndex,
        renderIcon,
        formatCommand
      },
      item.id
    ) : /* @__PURE__ */ jsx(
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
    return className ? /* @__PURE__ */ jsx("div", { className, children: content }) : content;
  }) });
}
export {
  QuotermHost,
  dismissQuoterm,
  getQuotermsSnapshot,
  quoterm,
  useQuoterm
};
