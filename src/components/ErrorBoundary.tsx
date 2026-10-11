import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="pause-screen">
          <span className="wordmark">
            ebb<span>·</span>
          </span>
          <h1>Let’s take a moment.</h1>
          <p>
            Ebb couldn’t display this screen. Reload to try again. Your stored
            history has not been cleared.
          </p>
          <button className="button" onClick={() => location.reload()}>
            Reload Ebb
          </button>
          <a
            className="text-link"
            href="#/settings"
            onClick={() => this.setState({ failed: false })}
          >
            Open data & recovery
          </a>
        </main>
      );
    return this.props.children;
  }
}
