import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConsumedFoodsProvider } from "./context/ConsumedFoodsContext";

createRoot(document.getElementById("root")!).render(
    <ConsumedFoodsProvider>
        <App />
    </ConsumedFoodsProvider>
);
