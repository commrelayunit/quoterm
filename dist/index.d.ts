import * as React from 'react';

type QuotermVariant = "success" | "warning" | "error" | "info";
type QuotermPlacement = "auto" | "top" | "bottom" | "before" | "after" | "above" | "below";
type QuotermTheme = "light" | "dark" | "auto";
type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;
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
    zIndex?: number;
    theme?: QuotermTheme;
    portalTarget?: Element | DocumentFragment | null;
    renderIcon?: (variant: QuotermVariant) => React.ReactNode;
    formatCommand?: (variant: QuotermVariant, item: QuotermState) => string;
}
declare function getQuotermsSnapshot(): QuotermSnapshot;
declare function dismissQuoterm(id?: string): void;
declare function quoterm(input: QuotermInput): QuotermApi;
declare function useQuoterm(): {
    items: QuotermState[];
    quoterm: typeof quoterm;
    dismiss: typeof dismissQuoterm;
};
declare function QuotermHost({ className, maxItems, gutter, maxWidth, zIndex, theme, portalTarget, renderIcon, formatCommand, }: QuotermHostProps): React.JSX.Element | null;

export { type QuotermApi, type QuotermDismiss, QuotermHost, type QuotermHostProps, type QuotermInput, type QuotermPlacement, type QuotermSnapshot, type QuotermSource, type QuotermState, type QuotermTheme, type QuotermVariant, dismissQuoterm, getQuotermsSnapshot, quoterm, useQuoterm };
