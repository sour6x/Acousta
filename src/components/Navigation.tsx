import Link from "next/link";
import Image from "next/image";
import { Icon } from "./Icon";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Acousta home">
      <Image src="/acousta-logo.png" width={48} height={44} className="brand-logo" alt="" priority unoptimized />
      <span>Acousta<span className="brand-period">.</span></span>
    </Link>
  );
}

export function Navigation({ studio = false }: { studio?: boolean }) {
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          {studio ? (
            <>
              <span className="nav-current">Practice studio</span>
              <Link href="/" className="nav-back"><Icon name="arrow-left" size={15}/> Back home</Link>
            </>
          ) : (
            <>
              <Link href="/studio" className="nav-cta">Open studio <Icon name="arrow" size={16} /></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span><strong>Acousta.</strong> Every song, a little closer.</span>
        <span>Made for curious guitarists · Built with Next.js</span>
      </div>
    </footer>
  );
}
