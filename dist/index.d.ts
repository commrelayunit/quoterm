import * as React from 'react';

type QuotermVariant = "success" | "warning" | "error" | "info";
type QuotermPlacement = "auto" | "top" | "bottom";
type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;
interface QuotermInput {
    title?: React.ReactNode;
    message?: React.ReactNode;
    description?: React.ReactNode;
    variant?: QuotermVariant;
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
declare function QuotermHost({ className, maxItems, gutter, maxWidth, zIndex, portalTarget, renderIcon, formatCommand, }: QuotermHostProps): React.ReactPortal | null;

export { type QuotermApi, type QuotermDismiss, QuotermHost, type QuotermHostProps, type QuotermInput, type QuotermPlacement, type QuotermSnapshot, type QuotermSource, type QuotermState, type QuotermVariant, dismissQuoterm, getQuotermsSnapshot, quoterm, useQuoterm };
