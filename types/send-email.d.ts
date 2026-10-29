// Keep declarations outside Netlify's deployable function directory.
declare module '*netlify/functions/send-email.js' {
  export const config: {
    path: string;
    rateLimit: { windowLimit: number; windowSize: number; aggregateBy: string[] };
  };
  export default function sendEmail(request: Request): Promise<Response>;
}
