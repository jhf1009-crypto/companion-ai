import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/barbearia.html"
      title="Barbearia Exclusiva"
      style={{
        width: "100%",
        minHeight: "100vh",
        border: 0,
        display: "block",
        background: "#080808",
      }}
    />
  );
}
