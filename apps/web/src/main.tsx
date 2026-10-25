import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createAppStore } from "./state/appStore";
import { createFinanceGateway } from "./data/createFinanceGateway";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppRouter } from "./AppRouter";
import "./styles.css";

const store = createAppStore({ finance: createFinanceGateway() });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <AppRouter />
      </Provider>
    </AppErrorBoundary>
  </React.StrictMode>
);
