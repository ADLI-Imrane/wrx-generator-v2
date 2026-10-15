import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreativeHomepage, {
  ActivityInstrument,
  IdentityInstrument,
  MANAGED_QR,
  RoutingInstrument,
  SignatureInstrument,
  STATIC_CARD,
} from "./CreativeHomepage";

const mocks = vi.hoisted(() => ({
  dispose: vi.fn(),
  motion: vi.fn(() => vi.fn()),
}));
vi.mock("../brand-hero/createBrandConstruction", () => ({
  createBrandConstruction: () => ({ dispose: mocks.dispose }),
}));
vi.mock("./createCreativeMotion", () => ({
  createCreativeMotion: mocks.motion,
}));
afterEach(cleanup);
describe("WRX creative V4", () => {
  it("provides immediate CTAs, the full product narrative and motion control", () => {
    const view = render(
      <MemoryRouter>
        <CreativeHomepage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Créez. Faites circuler." }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Créer mon espace WRX" })[0],
    ).toHaveAttribute("href", "/register");
    expect(
      screen.getByRole("heading", {
        name: "Un espace. Votre manière de faire.",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Réduire le mouvement" }),
    );
    expect(view.container.querySelector("main")).toHaveAttribute(
      "data-motion",
      "false",
    );
    expect(mocks.motion).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.any(Object),
      false,
    );
    view.unmount();
    expect(mocks.dispose).toHaveBeenCalled();
  });
  it("carries the route cue into the pinned journey and releases it toward the signature", () => {
    const view = render(
      <MemoryRouter>
        <CreativeHomepage />
      </MemoryRouter>,
    );
    expect(
      view.container.querySelector(".v4-approach-path"),
    ).toBeInTheDocument();
    expect(
      view.container.querySelector(".v4-depth-reference"),
    ).toBeInTheDocument();
    expect(
      view.container.querySelector(".v4-release-path"),
    ).toBeInTheDocument();
    expect(view.container.querySelector(".v4-release-mail")).toHaveTextContent(
      "Nora Kane",
    );
    expect(view.container.querySelector(".v4-progress")).toBeInTheDocument();
    expect(
      view.container.querySelector(".v4-journey")?.nextElementSibling,
    ).toHaveClass("v4-signature");
  });
  it("keeps the managed QR and link stable while the destination changes; direct QR changes its payload", () => {
    const view = render(<RoutingInstrument />);
    const proof = screen.getByRole("img");
    expect(proof).toHaveAttribute("data-payload", MANAGED_QR);
    const link = view.container.querySelector(".v4-link")?.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Prendre contact" }));
    expect(view.container.querySelector(".v4-link")?.textContent).toBe(link);
    expect(proof).toHaveAttribute("data-payload", MANAGED_QR);
    fireEvent.click(screen.getByRole("button", { name: "QR direct" }));
    expect(proof).toHaveAttribute(
      "data-payload",
      "https://atelier-azur.example/contact",
    );
    fireEvent.click(screen.getByRole("button", { name: "Portfolio" }));
    expect(proof).toHaveAttribute(
      "data-payload",
      "https://atelier-azur.example/portfolio",
    );
  });
  it("keeps physical card QR static and opens its independent digital presentation", () => {
    const view = render(<IdentityInstrument />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-payload",
      STATIC_CARD,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Découvrir la carte digitale de démonstration",
      }),
    );
    expect(view.container.querySelector("article")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Enregistrer le contact" }),
    ).toBeInTheDocument();
  });
  it("makes signature layout independent and reports clipboard failure truthfully", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("denied"),
    );
    render(<SignatureInstrument />);
    fireEvent.click(screen.getByRole("button", { name: "Éditoriale" }));
    expect(screen.getByRole("button", { name: "Éditoriale" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Copier la signature" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Copie indisponible",
    );
  });
  it("filters only real supported demo event types and reveals a selected event", () => {
    const view = render(<ActivityInstrument />);
    const records = Array.from(
      view.container.querySelectorAll(".v4-event-strike"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Scans" }));
    expect(view.container.querySelector(".v4-event-field")).toHaveAttribute(
      "data-filter",
      "scan",
    );
    expect(
      Array.from(view.container.querySelectorAll(".v4-event-strike")),
    ).toEqual(records);
    expect(
      screen.getAllByRole("button", { name: /Scan de QR géré à/ }),
    ).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: /Clic de lien à/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Scan de QR géré à 10:49" }),
    );
    expect(screen.getByText("10:49 / 08 OCT. 2026")).toBeInTheDocument();
  });
});
