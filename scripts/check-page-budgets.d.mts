export interface PageBudgets {
  htmlBytes: number;
  htmlGzipBytes: number;
  inlineCssBytes: number;
  initialJsGzipBytes: number;
}
export interface PageBudgetResult {
  route: string;
  htmlBytes: number;
  htmlGzipBytes: number;
  initialJsGzipBytes: number;
  failures: string[];
  noindex: boolean;
}
export const budgets: PageBudgets;
export function inspectPage(html: string, route: string, readAsset: (asset: string) => Buffer, limits?: PageBudgets): PageBudgetResult;
export function checkPages(directory: string): PageBudgetResult[];
