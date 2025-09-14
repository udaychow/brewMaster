import { AgentOrchestratorApp } from './app';
import logger from './utils/logger';
import config from './config';

// Create and start the application
const app = new AgentOrchestratorApp();

// Start the application
app.start().catch((error) => {
  logger.error('Failed to start Agent Orchestrator', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});

// Export for testing
export { AgentOrchestratorApp };
