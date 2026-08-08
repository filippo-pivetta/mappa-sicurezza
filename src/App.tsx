import { useRoute } from "./lib/router";
import { HomePage } from "./pages/HomePage";
import { OffertaPage } from "./pages/OffertaPage";
import { DomandaPage } from "./pages/DomandaPage";
import { CoperturaPage } from "./pages/CoperturaPage";

function App() {
  const route = useRoute();
  if (route === "offerta") return <OffertaPage />;
  if (route === "domanda") return <DomandaPage />;
  if (route === "copertura") return <CoperturaPage />;
  return <HomePage />;
}

export default App;
