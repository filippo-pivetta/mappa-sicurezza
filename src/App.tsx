import { useRoute } from "./lib/router";
import { HomePage } from "./pages/HomePage";
import { OffertaPage } from "./pages/OffertaPage";
import { DomandaPage } from "./pages/DomandaPage";

function App() {
  const route = useRoute();
  if (route === "offerta") return <OffertaPage />;
  if (route === "domanda") return <DomandaPage />;
  return <HomePage />;
}

export default App;
