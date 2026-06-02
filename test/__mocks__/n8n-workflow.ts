/**
 * Runtime mock for n8n-workflow used by Jest.
 *
 * Provides stub implementations of classes and enums needed by the node source files.
 * This avoids loading the actual n8n-workflow ESM bundle which doesn't run under CommonJS Jest.
 */

class NodeApiError extends Error {
  public readonly node: unknown;
  public readonly error: unknown;
  public readonly options?: { message?: string; description?: string };

  constructor(
    node: unknown,
    error: unknown,
    options?: { message?: string; description?: string },
  ) {
    const msg =
      options?.message ??
      (error instanceof Error ? error.message : 'NodeApiError');
    super(msg);
    this.name = 'NodeApiError';
    this.node = node;
    this.error = error;
    this.options = options;
  }
}

class NodeOperationError extends Error {
  public readonly node: unknown;
  public readonly options?: { itemIndex?: number };

  constructor(node: unknown, message: string, options?: { itemIndex?: number }) {
    super(message);
    this.name = 'NodeOperationError';
    this.node = node;
    this.options = options;
  }
}

// Enum stub — mirrors NodeConnectionType.Main used in node files
const NodeConnectionType = {
  Main: 'main',
} as const;

module.exports = {
  NodeApiError,
  NodeOperationError,
  NodeConnectionType,
};
