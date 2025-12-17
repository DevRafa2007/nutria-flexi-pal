import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConsumedFoodsProvider } from "./context/ConsumedFoodsContext";
import { ConsumptionProvider } from "./context/ConsumptionContext";

createRoot(document.getElementById("root")!).render(
    <ConsumedFoodsProvider>
        <ConsumptionProvider>
            <App />
        </ConsumptionProvider>
    </ConsumedFoodsProvider>
);
