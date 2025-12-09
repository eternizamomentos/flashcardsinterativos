import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    if (process.env.NODE_ENV !== 'production') {
      console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    }
    // Aqui pode-se adicionar ponto de integração com logger externo (ex: Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto p-8 mt-12 rounded bg-red-50 text-red-900 shadow-md">
          <h2 className="font-bold text-2xl mb-2">Algo deu errado.</h2>
          <p className="mb-3">Houve um erro ao renderizar a interface. Tente voltar à página inicial ou recarregar.</p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-4 text-xs bg-gray-100 text-gray-700 rounded p-2">
              <pre>{this.state.error.toString()}</pre>
              {this.state.errorInfo && <pre>{this.state.errorInfo.componentStack}</pre>}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
