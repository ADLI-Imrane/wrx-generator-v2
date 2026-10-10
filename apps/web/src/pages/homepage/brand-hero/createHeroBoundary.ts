import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  BrandConstruction,
  CutProjection,
} from "./createBrandConstruction";

gsap.registerPlugin(ScrollTrigger);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function boundaryState(progress: number) {
  const p = clamp(progress);
  return {
    release: clamp(p / 0.3),
    continuation: clamp((p - 0.18) / 0.22),
    rule: clamp((p - 0.32) / 0.36),
    address: clamp((p - 0.48) / 0.2),
  };
}

/** One native-scroll boundary, no pin, smoothing, ticker or React progress state. */
export function createHeroBoundary(
  root: HTMLElement,
  host: HTMLElement,
  construction?: BrandConstruction,
) {
  const svg = root.querySelector<SVGSVGElement>(".bh-route");
  const path = root.querySelector<SVGPathElement>(".bh-route-path");
  const address = root.querySelector<HTMLElement>(".bh-route-address");
  if (!svg || !path || !address)
    return () => {
      /* No handoff DOM to coordinate. */
    };
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let trigger: ScrollTrigger | undefined;
  let projection: CutProjection | undefined;
  let length = 1;
  let progress = 0;

  const apply = (value: number) => {
    progress = value;
    const state = boundaryState(value);
    const reduced = preference.matches || !construction;
    construction?.setRelease(
      reduced ? 0 : state.release,
      reduced ? 0 : state.continuation,
    );
    path.style.strokeDashoffset = String(
      length * (1 - (reduced ? 1 : state.rule)),
    );
    svg.style.opacity = reduced || state.rule > 0 ? "1" : "0";
    address.style.opacity = String(reduced ? 1 : state.address);
  };

  // Layout reads happen only at initial setup / resize, never in the scroll callback.
  const measure = () => {
    const width = root.clientWidth;
    const rootRect = root.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const addressRect = address.getBoundingClientRect();
    const height =
      Math.max(
        hostRect.bottom - rootRect.top,
        addressRect.bottom - rootRect.top,
      ) + 40;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.height = `${height}px`;
    const reduced = preference.matches || !construction;
    const point = projection
      ? reduced
        ? projection.origin
        : projection.exit
      : { x: host.clientWidth * 0.7, y: host.clientHeight * 0.6 };
    const x = hostRect.left - rootRect.left + point.x;
    const y = hostRect.top - rootRect.top + point.y;
    const endX = addressRect.left - rootRect.left;
    const endY = addressRect.top - rootRect.top - 20;
    const elbowX = projection?.mobile ? width - 24 : x - 24;
    const radius = 12;
    const direction = elbowX > x ? 1 : -1;
    path.setAttribute(
      "d",
      `M ${x} ${y} L ${elbowX - direction * radius} ${y} Q ${elbowX} ${y} ${elbowX} ${y + radius} L ${elbowX} ${endY - radius} Q ${elbowX} ${endY} ${elbowX - radius} ${endY} L ${endX} ${endY}`,
    );
    length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    apply(progress);
  };

  const setup = () => {
    trigger?.kill();
    trigger = undefined;
    root.dataset["motion"] = preference.matches ? "reduced" : "native";
    measure();
    if (preference.matches || !construction) {
      apply(1);
      return;
    }
    trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: () =>
        `+=${Math.max(1, (root.querySelector<HTMLElement>(".bh-hero")?.clientHeight ?? window.innerHeight) * 0.43)}`,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(trigger.progress);
  };
  const unsubscribe = construction?.subscribeLayout((value) => {
    projection = value;
    measure();
  });
  const resizeObserver = new ResizeObserver(() => {
    measure();
    trigger?.refresh();
  });
  resizeObserver.observe(root);
  preference.addEventListener("change", setup);
  setup();
  return () => {
    trigger?.kill();
    resizeObserver.disconnect();
    unsubscribe?.();
    preference.removeEventListener("change", setup);
    path.style.strokeDasharray = path.style.strokeDashoffset = "";
    svg.style.opacity = address.style.opacity = "";
    delete root.dataset["motion"];
  };
}
