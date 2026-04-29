import type { ExecutionEngine } from '@/lib/execution-engine';
import { GitHubActionsEngine } from '@/lib/engines/github-actions';

/**
 * Returns the configured execution engine.
 *
 * Set EXECUTION_ENGINE env var to switch backends:
 *   - "github" (default) — GitHub Actions
 *   - "lambda" — AWS Lambda (not yet implemented)
 *   - "modal"  — Modal.com (not yet implemented)
 *   - "docker" — Self-hosted Docker (not yet implemented)
 *
 * The engine is a singleton — created once per process.
 */

let _engine: ExecutionEngine | null = null;

export function getEngine(): ExecutionEngine {
  if (_engine) return _engine;

  const backend = process.env.EXECUTION_ENGINE || "github";

  switch (backend) {
    case "github":
      _engine = new GitHubActionsEngine();
      break;
    // Future engines:
    // case "lambda":
    //   _engine = new LambdaEngine();
    //   break;
    // case "modal":
    //   _engine = new ModalEngine();
    //   break;
    // case "docker":
    //   _engine = new DockerEngine();
    //   break;
    default:
      throw new Error(`Unknown execution engine: ${backend}. Valid options: github, lambda, modal, docker`);
  }

  return _engine;
}
