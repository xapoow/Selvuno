import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen } from "./ErrorScreen";
import { getDictionary } from "../i18n";

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
    const t = getDictionary(typeof navigator === "undefined" ? "en-US" : navigator.language);

    return (
      <ErrorScreen
        kind="runtime"
        copy={t.errors}
        details={details}
        primaryAction={{
          label: t.errors.actions.reloadApp,
          onClick: () => window.location.reload()
        }}
        secondaryAction={{
          label: t.errors.actions.goHome,
          variant: "secondary",
          onClick: () => {
            window.location.href = "/";
          }
        }}
      />
    );
  }
}
