import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  /** Called once when a load failure is caught - useful for logging/telemetry hooks later. */
  onError?: (error: unknown) => void;
}

interface State {
  hasError: boolean;
}

/**
 * Catches GLB load failures (missing file, malformed file, network error)
 * from GLBModel/useGLTF and renders the procedural fallback instead.
 * Hooks can't catch render-phase errors, hence a class component - this is
 * the one place in the visualization layer that needs one.
 *
 * Why this exists at all: Part 7 of the GLB requirements is explicit that
 * a broken or not-yet-provided asset must never blank the scene or throw
 * an uncaught error. Since assets are supplied incrementally (Part 9), this
 * boundary is not an edge case - it's expected to trigger routinely for
 * every reference that doesn't have a model yet.
 */
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
