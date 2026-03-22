import { registerRoot } from "remotion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    StrictMode ? <StrictMode><RemotionRoot /></StrictMode> : <RemotionRoot />
  );
}
