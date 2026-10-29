import { resolve } from 'node:path';
import { inspectEmittedHtml } from './lib/emitted-html-quality.mjs';

const dist = resolve(process.argv[2] ?? 'dist');

try {
  const report = await inspectEmittedHtml(dist);
  for (const route of report.routes) {
    console.log(`${route.route}: html ${route.htmlGzipBytes} B gzip, initial JS ${route.initialModulesGzipBytes} B gzip, inline JS ${route.inlineExecutableGzipBytes} B gzip`);
  }
  console.log(`${report.pageCount} emitted HTML pages passed; all emitted JS: ${report.totalEmittedJavaScriptGzipBytes} B gzip (reported, not capped)`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
