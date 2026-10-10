import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RoutingComposition,
  IdentityComposition,
  ActivityWorkspace,
  MANAGED_INGRESS,
  CARD_URL,
} from "./ProductCompositions";
import { sampleEvents } from "./demoRecords";

vi.mock("./useCompositionMotion", () => ({ useCompositionMotion: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Public product demonstrations", () => {
  it("changes only the destination while the managed QR and WRX identity hold", () => {
    render(<RoutingComposition />);
    const qr = screen.getByRole("img", {
      name: "QR géré de démonstration, entrée WRX stable",
    });
    fireEvent.click(screen.getByRole("button", { name: /Prendre contact/ }));
    expect(
      screen.getByText("atelier-azur.example/contact"),
    ).toBeInTheDocument();
    expect(qr).toHaveAttribute("data-payload", MANAGED_INGRESS);
    expect(screen.getByText("wrx.example/r/azur")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Prendre contact/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("keeps direct QR content independent from the editable Link demonstration", () => {
    render(<RoutingComposition />);
    fireEvent.click(screen.getByRole("button", { name: "QR direct" }));
    fireEvent.click(screen.getByRole("button", { name: /Prendre contact/ }));
    expect(
      screen.getByRole("img", { name: /QR direct, contenu/ }),
    ).toHaveAttribute("data-payload", "https://atelier-azur.example/portfolio");
    expect(
      screen.getByText(/Un autre contenu demande un autre QR/),
    ).toBeInTheDocument();
  });
  it("uses a separate static published-card QR and explicitly independent identity copy", () => {
    render(<IdentityComposition />);
    expect(
      screen.getByRole("img", { name: /QR statique vers/ }),
    ).toHaveAttribute("data-payload", CARD_URL);
    expect(
      screen.getByText("Ce QR statique ouvre la carte publiée."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Une copie, modifiable indépendamment."),
    ).toBeInTheDocument();
  });
  it("copies the synthetic public address when native Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<IdentityComposition />);
    fireEvent.click(screen.getByRole("button", { name: "Partager" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(CARD_URL));
    expect(
      screen.getByText("Adresse de démonstration copiée."),
    ).toBeInTheDocument();
  });
  it("derives two totals from the same records and exposes event details on click", () => {
    render(<ActivityWorkspace />);
    expect(sampleEvents.filter((event) => event.type === "click")).toHaveLength(
      4,
    );
    expect(sampleEvents.filter((event) => event.type === "scan")).toHaveLength(
      3,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Scan QR géré à 10:49" }),
    );
    expect(screen.getByText("Scan à l’entrée du QR géré")).toBeInTheDocument();
    expect(screen.getByText("DONNÉES DE DÉMONSTRATION")).toBeInTheDocument();
  });
  it("presents Password Generator as independent rather than link protection", () => {
    render(<ActivityWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: /Mots de passe/ }));
    expect(
      screen.getByText(
        "Un générateur indépendant pour vos besoins de sécurité.",
      ),
    ).toBeInTheDocument();
  });
});
