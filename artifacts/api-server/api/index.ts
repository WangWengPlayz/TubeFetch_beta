/**
 * Vercel serverless entry point.
 * Exports the Express app without calling app.listen() —
 * Vercel wraps it automatically as a serverless function.
 */
import app from "../src/app";

export default app;
