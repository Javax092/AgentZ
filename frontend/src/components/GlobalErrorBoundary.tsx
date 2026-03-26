import { Component, ReactNode } from "react";
import { log } from "../services/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Erro inesperado na interface."
    };
  }

  componentDidCatch(error: Error) {
    log("error", "ui", "runtime_error_boundary", { message: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-mist p-6">
          <div className="max-w-lg rounded-[28px] bg-white p-8 shadow-panel">
            <p className="font-display text-3xl text-gray-900">Falha global da interface</p>
            <p className="mt-3 text-gray-700">{this.state.message}</p>
            <button onClick={() => window.location.reload()} className="mt-6 rounded-2xl bg-ink px-5 py-3 font-semibold text-white">
              Recarregar app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
