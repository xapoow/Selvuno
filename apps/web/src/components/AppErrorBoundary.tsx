import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen } from "./ErrorScreen";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
  info: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
    info: null
  };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const details = [
      this.state.error.name,
      this.state.error.message,
      this.state.error.stack,
      this.state.info?.componentStack
    ]
      .filter(Boolean)
      .join("\n\n");

    return (
      <ErrorScreen
        kind="runtime"
        details={details}
        primaryAction={{
          label: "Reload app",
          onClick: () => window.location.reload()
        }}
        secondaryAction={{
          label: "Go home",
          variant: "secondary",
          onClick: () => {
            window.location.href = "/";
          }
        }}
      />
    );
  }
}
