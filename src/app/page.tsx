import { Navigation } from "@/components/Navigation";
import { UploadZone } from "@/components/UploadZone";

export default function HomePage() {
  return (
    <div className="site-shell home-shell">
      <Navigation />
      <main className="home-main container">
        <div className="home-content">
          <h1>Songs made easier for guitarists, <span>by guitarists.</span></h1>
          <UploadZone />
        </div>
      </main>
    </div>
  );
}
