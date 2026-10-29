import React, { ReactNode } from 'react';
import { SiteNavV2 } from './SiteNavV2';
import { SiteFooterV2 } from './SiteFooterV2';
import { T } from './primitives';

interface LayoutV2Props {
  children: ReactNode;
  activePage?: string;
}

export const LayoutV2: React.FC<LayoutV2Props> = ({ children, activePage }) => (
  <div className="ft-page" style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: T.paper,
    color: T.ink,
    overflowX: 'clip',
  }}>
    <SiteNavV2 activePage={activePage} />
    <main style={{ flex: 1 }}>{children}</main>
    <SiteFooterV2 />
  </div>
);
