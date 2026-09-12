import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Route error:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section>
        <h2>{this.props.title ?? "Something went wrong"}</h2>
        <p>This section is temporarily unavailable.</p>
        <button type="button" onClick={this.handleRetry}>
          Try again
        </button>
      </section>
    );
  }
}
