// Decorative glyph outlines for the problem family (src/components/ProblemIcon.astro).
// Shapes are copied verbatim from the installed lucide-react v0.554.0 package
// (ISC licence, https://lucide.dev) via .artifacts/problem-icon-source.json:
// the 51 names in the pages/ProblemPage.tsx iconMap plus the XCircle symptom
// marker and the ChevronDown/ChevronUp FAQ markers the page renders directly.
// Each node is [tagName, attributes] inside a 24x24 stroked viewBox.
const path = d => ['path', { d }];
const circle = (cx, cy, r) => ['circle', { cx, cy, r }];
const line = (x1, y1, x2, y2) => ['line', { x1, x2, y1, y2 }];
const rect = attrs => ['rect', attrs];

export const ICON_NODES = Object.freeze({
  CheckCircle: [path('M21.801 10A10 10 0 1 1 17 3.335'), path('m9 11 3 3L22 4')],
  Shield: [path('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z')],
  Zap: [path('M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z')],
  RefreshCw: [path('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'), path('M21 3v5h-5'), path('M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'), path('M8 16H3v5')],
  Cloud: [path('M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z')],
  Database: [['ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }], path('M3 5V19A9 3 0 0 0 21 19V5'), path('M3 12A9 3 0 0 0 21 12')],
  Lock: [rect({ width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' }), path('M7 11V7a5 5 0 0 1 10 0v4')],
  Mail: [path('m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7'), rect({ x: '2', y: '4', width: '20', height: '16', rx: '2' })],
  Globe: [circle('12', '12', '10'), path('M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'), path('M2 12h20')],
  Key: [path('m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4'), path('m21 2-9.6 9.6'), circle('7.5', '15.5', '5.5')],
  Monitor: [rect({ width: '20', height: '14', x: '2', y: '3', rx: '2' }), line('8', '21', '16', '21'), line('12', '17', '12', '21')],
  Eye: [path('M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0'), circle('12', '12', '3')],
  Cpu: [path('M12 20v2'), path('M12 2v2'), path('M17 20v2'), path('M17 2v2'), path('M2 12h2'), path('M2 17h2'), path('M2 7h2'), path('M20 12h2'), path('M20 17h2'), path('M20 7h2'), path('M7 20v2'), path('M7 2v2'), rect({ x: '4', y: '4', width: '16', height: '16', rx: '2' }), rect({ x: '8', y: '8', width: '8', height: '8', rx: '1' })],
  Package: [path('M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z'), path('M12 22V12'), ['polyline', { points: '3.29 7 12 12 20.71 7' }], path('m7.5 4.27 9 5.15')],
  Bug: [path('M12 20v-9'), path('M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z'), path('M14.12 3.88 16 2'), path('M21 21a4 4 0 0 0-3.81-4'), path('M21 5a4 4 0 0 1-3.55 3.97'), path('M22 13h-4'), path('M3 21a4 4 0 0 1 3.81-4'), path('M3 5a4 4 0 0 0 3.55 3.97'), path('M6 13H2'), path('m8 2 1.88 1.88'), path('M9 7.13V6a3 3 0 1 1 6 0v1.13')],
  Wifi: [path('M12 20h.01'), path('M2 8.82a15 15 0 0 1 20 0'), path('M5 12.859a10 10 0 0 1 14 0'), path('M8.5 16.429a5 5 0 0 1 7 0')],
  Activity: [path('M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2')],
  Network: [rect({ x: '16', y: '16', width: '6', height: '6', rx: '1' }), rect({ x: '2', y: '16', width: '6', height: '6', rx: '1' }), rect({ x: '9', y: '2', width: '6', height: '6', rx: '1' }), path('M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3'), path('M12 12V8')],
  Search: [path('m21 21-4.34-4.34'), circle('11', '11', '8')],
  TrendingUp: [path('M16 7h6v6'), path('m22 7-8.5 8.5-5-5L2 17')],
  TrendingDown: [path('M16 17h6v-6'), path('m22 17-8.5-8.5-5 5L2 7')],
  UserMinus: [path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), circle('9', '7', '4'), line('22', '11', '16', '11')],
  Clock: [path('M12 6v6l4 2'), circle('12', '12', '10')],
  FileCheck: [path('M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z'), path('M14 2v5a1 1 0 0 0 1 1h5'), path('m9 15 2 2 4-4')],
  ListChecks: [path('M13 5h8'), path('M13 12h8'), path('M13 19h8'), path('m3 17 2 2 4-4'), path('m3 7 2 2 4-4')],
  Scale: [path('m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z'), path('m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z'), path('M7 21h10'), path('M12 3v18'), path('M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2')],
  Handshake: [path('m11 17 2 2a1 1 0 1 0 3-3'), path('m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4'), path('m21 3 1 11h-2'), path('M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3'), path('M3 4h8')],
  AlertTriangle: [path('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'), path('M12 9v4'), path('M12 17h.01')],
  Truck: [path('M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2'), path('M15 18H9'), path('M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14'), circle('17', '18', '2'), circle('7', '18', '2')],
  Maximize: [path('M8 3H5a2 2 0 0 0-2 2v3'), path('M21 8V5a2 2 0 0 0-2-2h-3'), path('M3 16v3a2 2 0 0 0 2 2h3'), path('M16 21h3a2 2 0 0 0 2-2v-3')],
  ClipboardCheck: [rect({ width: '8', height: '4', x: '8', y: '2', rx: '1', ry: '1' }), path('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'), path('m9 14 2 2 4-4')],
  PiggyBank: [path('M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z'), path('M16 10h.01'), path('M2 8v1a2 2 0 0 0 2 2h1')],
  ShieldOff: [path('m2 2 20 20'), path('M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71'), path('M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264')],
  FolderSync: [path('M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5'), path('M12 10v4h4'), path('m12 14 1.535-1.605a5 5 0 0 1 8 1.5'), path('M22 22v-4h-4'), path('m22 18-1.535 1.605a5 5 0 0 1-8-1.5')],
  Radio: [path('M16.247 7.761a6 6 0 0 1 0 8.478'), path('M19.075 4.933a10 10 0 0 1 0 14.134'), path('M4.925 19.067a10 10 0 0 1 0-14.134'), path('M7.753 16.239a6 6 0 0 1 0-8.478'), circle('12', '12', '2')],
  MapPin: [path('M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'), circle('12', '10', '3')],
  BookOpen: [path('M12 7v14'), path('M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z')],
  MessageSquare: [path('M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z')],
  Target: [circle('12', '12', '10'), circle('12', '12', '6'), circle('12', '12', '2')],
  GitBranch: [line('6', '3', '6', '15'), circle('18', '6', '3'), circle('6', '18', '3'), path('M18 9a9 9 0 0 1-9 9')],
  HardDrive: [line('22', '12', '2', '12'), path('M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'), line('6', '16', '6.01', '16'), line('10', '16', '10.01', '16')],
  HelpCircle: [circle('12', '12', '10'), path('M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'), path('M12 17h.01')],
  CreditCard: [rect({ width: '20', height: '14', x: '2', y: '5', rx: '2' }), line('2', '10', '22', '10')],
  Calendar: [path('M8 2v4'), path('M16 2v4'), rect({ width: '18', height: '18', x: '3', y: '4', rx: '2' }), path('M3 10h18')],
  Server: [rect({ width: '20', height: '8', x: '2', y: '2', rx: '2', ry: '2' }), rect({ width: '20', height: '8', x: '2', y: '14', rx: '2', ry: '2' }), line('6', '6', '6.01', '6'), line('6', '18', '6.01', '18')],
  Headphones: [path('M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3')],
  Wrench: [path('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z')],
  FileText: [path('M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z'), path('M14 2v5a1 1 0 0 0 1 1h5'), path('M10 9H8'), path('M16 13H8'), path('M16 17H8')],
  Users: [path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), path('M16 3.128a4 4 0 0 1 0 7.744'), path('M22 21v-2a4 4 0 0 0-3-3.87'), circle('9', '7', '4')],
  Phone: [path('M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384')],
  ArrowRight: [path('M5 12h14'), path('m12 5 7 7-7 7')],
  // Rendered directly by ProblemPage.tsx, not via the iconMap.
  XCircle: [circle('12', '12', '10'), path('m15 9-6 6'), path('m9 9 6 6')],
  ChevronDown: [path('m6 9 6 6 6-6')],
  ChevronUp: [path('m18 15-6-6-6 6')],
});

// Tags the glyph renderer is allowed to emit; anything else is a packet error.
export const ICON_TAGS = Object.freeze(['path', 'circle', 'ellipse', 'line', 'rect', 'polyline']);

export function iconNodes(name) {
  const nodes = Object.hasOwn(ICON_NODES, name) ? ICON_NODES[name] : null;
  if (!nodes) throw new Error(`No problem-family glyph named "${name}"`);
  return nodes;
}
