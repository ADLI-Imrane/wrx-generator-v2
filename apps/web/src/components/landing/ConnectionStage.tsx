import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Rotate3D } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import gsap from 'gsap';

export function ConnectionStage() {
  const stage = useRef<HTMLElement>(null);
  const [flipped, setFlipped] = useState(false);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.stage-title span', {
          yPercent: 110,
          rotate: 4,
          stagger: 0.12,
          duration: 1.1,
          ease: 'power4.out',
        });
        gsap.from('.stage-object', {
          y: 90,
          opacity: 0,
          rotate: -12,
          duration: 1.3,
          ease: 'power3.out',
          delay: 0.2,
        });
        gsap.to('.stage-orbit', { rotation: 360, duration: 65, ease: 'none', repeat: -1 });
        gsap.to('.stage-coordinate-cross', {
          rotation: 180,
          duration: 8,
          repeat: -1,
          ease: 'none',
        });
      });
      media.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const element = stage.current;
        if (!element) return;
        const x = gsap.quickTo('.stage-tilt', 'rotationY', { duration: 0.7, ease: 'power3.out' });
        const y = gsap.quickTo('.stage-tilt', 'rotationX', { duration: 0.7, ease: 'power3.out' });
        const lightX = gsap.quickTo('.stage-light', 'x', { duration: 0.9 });
        const lightY = gsap.quickTo('.stage-light', 'y', { duration: 0.9 });
        const move = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          x(px * 30);
          y(-py * 24);
          lightX(px * 160);
          lightY(py * 120);
        };
        const leave = () => {
          x(0);
          y(0);
          lightX(0);
          lightY(0);
        };
        element.addEventListener('pointermove', move);
        element.addEventListener('pointerleave', leave);
        return () => {
          element.removeEventListener('pointermove', move);
          element.removeEventListener('pointerleave', leave);
        };
      });
    }, stage);
    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <section ref={stage} id="top" className="connection-stage">
      <div className="stage-grid" aria-hidden="true" />
      <div className="stage-light" aria-hidden="true" />
      <div className="stage-meta">
        <span>
          <b /> WRX CONNECTION STUDIO
        </span>
        <span>LIENS / QR / IMPACT</span>
        <span>EXPLORATION 001—026</span>
      </div>
      <div className="stage-main">
        <div className="stage-editorial">
          <p className="stage-eyebrow">LE MONDE RÉEL A UN RACCOURCI.</p>
          <h1 className="stage-title" aria-label="Make it connect.">
            <span>MAKE</span>
            <span>
              IT <em>↗</em>
            </span>
            <span>CONNECT.</span>
          </h1>
          <div className="stage-intro">
            <p>
              Vos idées méritent une suite.
              <br />
              Un lien. Un scan. Une nouvelle connexion.
            </p>
            <Link className="stage-cta" to="/register">
              Créer la connexion <ArrowUpRight size={22} />
            </Link>
          </div>
        </div>
        <div className="stage-object">
          <div className="stage-orbit" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="stage-tilt">
            <button
              className={`connection-card ${flipped ? 'is-flipped' : ''}`}
              onClick={() => setFlipped((current) => !current)}
              aria-label="Retourner le QR interactif"
              aria-pressed={flipped}
            >
              <span className="connection-face connection-front" aria-hidden={flipped}>
                <span className="connection-card-top">
                  <b>wrx®</b>
                  <span>
                    THE CONNECTION
                    <br />
                    PASS / № 001
                  </span>
                </span>
                <span className="connection-qr">
                  <QRCodeSVG
                    value="https://github.com/ADLI-Imrane/wrx-generator-v2"
                    fgColor="#eee9de"
                    bgColor="#272923"
                    size={240}
                    marginSize={4}
                  />
                </span>
                <span className="connection-card-title">
                  ONE SCAN.
                  <br />
                  WHAT'S NEXT?
                </span>
                <span className="connection-card-bottom">
                  OFFLINE → ONLINE <ArrowUpRight size={25} />
                </span>
              </span>
              <span className="connection-face connection-back" aria-hidden={!flipped}>
                <span className="connection-card-top">
                  <b>wrx®</b>
                  <ArrowUpRight size={34} />
                </span>
                <span className="connection-back-title">
                  LE LIEN
                  <br />
                  DERRIÈRE
                  <br />
                  LE CODE.
                </span>
                <span className="connection-back-copy">
                  Ce QR ouvre le dépôt du projet WRX.
                  <br />
                  Une vraie destination, prête à scanner.
                </span>
                <span className="connection-card-bottom">GITHUB / WRX GENERATOR V2</span>
              </span>
            </button>
          </div>
          <span className="stage-card-hint">
            <Rotate3D size={18} /> Cliquez pour retourner
          </span>
          <span className="stage-coordinate-cross" aria-hidden="true">
            ✳
          </span>
        </div>
      </div>
      <div className="stage-bottom">
        <a href="#campaigns">
          Explorez les connexions <ArrowDown size={17} />
        </a>
        <span>BOUGEZ. SCANNEZ. CONNECTEZ.</span>
        <span>© WRX GENERATOR</span>
      </div>
    </section>
  );
}
