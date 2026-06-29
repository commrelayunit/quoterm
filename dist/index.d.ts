import * as React from 'react';

type QuotermVariant = "success" | "warning" | "error" | "info";
type QuotermPlacement = "auto" | "top" | "bottom" | "before" | "after" | "above" | "below";
type QuotermTheme = "light" | "dark" | "auto";
type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;
type QuotermRenderMode = "overlay" | "inline";
interface QuotermInput {
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
interface QuotermState extends Omit<QuotermInput, "source"> {
    id: string;
    open: boolean;
    createdAt: number;
    sourceRect: DOMRect | null;
    sourceElement: Element | null;
    variant: QuotermVariant;
}
interface QuotermSnapshot {
    items: QuotermState[];
}
interface QuotermDismiss {
    id: string;
    dismiss: () => void;
    update: (patch: Partial<QuotermInput>) => void;
}
type QuotermApi = QuotermDismiss;
interface QuotermHostProps {
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
interface QuotermInlineWidthOptions {
    min?: number;
    max?: number;
    /** Multiplies the source width before clamping. Defaults to 2.5. */
    sourceScale?: number;
}
declare function getQuotermsSnapshot(): QuotermSnapshot;
declare function dismissQuoterm(id?: string): void;
declare function quoterm(input: QuotermInput): QuotermApi;
declare function useQuoterm(): {
    items: QuotermState[];
    quoterm: typeof quoterm;
    dismiss: typeof dismissQuoterm;
};
declare function QuotermHost({ className, maxItems, gutter, maxWidth, minWidth, inlineWidth, zIndex, theme, renderMode, showCommandChrome, portalTarget, renderIcon, formatCommand, }: QuotermHostProps): React.JSX.Element | null;

export { type QuotermApi, type QuotermDismiss, QuotermHost, type QuotermHostProps, type QuotermInput, type QuotermPlacement, type QuotermRenderMode, type QuotermSnapshot, type QuotermSource, type QuotermState, type QuotermTheme, type QuotermVariant, dismissQuoterm, getQuotermsSnapshot, quoterm, useQuoterm };
