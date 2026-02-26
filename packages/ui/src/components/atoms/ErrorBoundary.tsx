import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
            <p className="text-destructive text-sm">Something went wrong.</p>
            <button
              onClick={() => window.location.reload()}
              className="underline text-sm text-(--color-text-secondary)"
            >
              Reload page
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
