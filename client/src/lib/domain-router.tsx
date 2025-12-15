import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation } from "wouter";

type DomainType = 'main' | 'admin' | 'tenant' | 'unknown';

interface VariableRoutes {
    main: ReactNode;
    admin: ReactNode;
    tenant: ReactNode;
}

export function DomainRouter({ children }: { children: ReactNode }) {
    // This component is a logic wrapper. In a real router change, we would conditionally
    // render different Switch blocks. However, passing children (the single large Switch)
    // makes it hard to split. We will instead expose a hook or just manage redirects here.
    //
    // BUT, to strictly enforce separation as requested, we should probably
    // return different route sets entirely.
    //
    // Refactored approach: logic inside App.tsx using a helper to determine domain type.
    return <>{ children } </>;
}

export function useDomainType(): DomainType {
    const [domainType, setDomainType] = useState<DomainType>('unknown');

    useEffect(() => {
        const hostname = window.location.hostname;

        // Localhost handling for testing
        if (hostname.includes('localhost') || hostname.includes('0.0.0.0') || hostname.includes('replit')) {
            // For development, we might want to see everything or use specific ports/params
            // For now, treat localhost as "tenant" (full app) to make dev easy, 
            // OR return 'unknown' to let the App decide default behavior.
            // Let's default to 'tenant' (full app) for dev, but we can override.
            setDomainType('tenant');
            return;
        }

        if (hostname.includes('admin.') || hostname.includes('admin-')) {
            setDomainType('admin');
        } else if (hostname.includes('myrentledger')) {
            setDomainType('tenant');
        } else {
            setDomainType('main'); // Assumes rentledger.co.uk
        }
    }, []);

    return domainType;
}

export const MAIN_DOMAIN = 'rentledger.co.uk';
export const APP_DOMAIN = 'myrentledger.co.uk';
export const ADMIN_SUBDOMAIN = 'admin.rentledger.co.uk';

export function getAppUrl(path: string = '') {
    const protocol = window.location.protocol;
    const isDev = window.location.hostname.includes('localhost');
    if (isDev) return path; // Stay on localhost
    return `${protocol}//${APP_DOMAIN}${path}`;
}

export function getAdminUrl(path: string = '') {
    const protocol = window.location.protocol;
    const isDev = window.location.hostname.includes('localhost');
    if (isDev) return path; // Stay on localhost
    return `${protocol}//${ADMIN_SUBDOMAIN}${path}`;
}
