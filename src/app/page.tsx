import Link from "next/link";
import { Navigation, Footer } from "@/components/Navigation";
import { UploadZone } from "@/components/UploadZone";
import { Icon } from "@/components/Icon";

const features = [
  { icon: "music", number: "01", title: "Chords, in context", description: "Follow each chord as the music plays, then jump directly to the part you want to practice." },
  { icon: "sliders", number: "02", title: "Play in your key", description: "Transpose chord names and choose your capo position to discover the guitar shapes you need." },
  { icon: "grid", number: "03", title: "Know your fretboard", description: "Explore major, minor and pentatonic scales across all six strings." },
  { icon: "headphones", number: "04", title: "Practice at your pace", description: "Slow playback down, loop difficult sections and focus on getting one change right." },
] as const;

const howItWorks = [
  { n: "01", title: "Choose a song", text: "Load an audio file from your computer, or open our built-in practice example." },
  { n: "02", title: "Explore the music", text: "Analyze the song for estimated chords, key and tempo, then correct the results by ear." },
  { n: "03", title: "Make it yours", text: "Transpose chords, calculate capo shapes, view diagrams and explore scales." },
] as const;

export default function HomePage() {
  return (
    <div className="site-shell">
      <Navigation />
      <main>
        <section className="hero-section">
          <div className="hero-ambient" aria-hidden="true"/>
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line"/> YOUR GUITAR COMPANION</div>
              <h1>Every song.<br/><span>A little closer.</span></h1>
              <p className="hero-description">From the first chord to your favorite solo. Fretwise brings your music, guitar tools and practice space together in one beautifully simple place.</p>
              <div className="hero-actions">
                <Link href="/studio" className="button button-outline"><Icon name="play" size={18}/> Try the practice demo</Link>
                <span className="hero-action-note">No account required</span>
              </div>
              <div className="hero-proof"><div className="proof-motif" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><span>Less guessing. More playing.</span></div>
            </div>
            <div className="hero-card">
              <div className="hero-card-top">
                <div><span className="small-label">YOUR NEXT SESSION</span><h2>Start with a song.</h2></div>
                <span className="small-pill"><span className="status-dot"/> Browser preview</span>
              </div>
              <UploadZone />
              <div className="upload-footer"><Icon name="info" size={14}/><span>Playback is local. Analysis sends audio to the configured service.</span></div>
            </div>
          </div>
          <div className="container hero-bottom"><span>MADE FOR THE WAY YOU PLAY</span><span className="hero-bottom-line"/><span>ACOUSTIC · ELECTRIC · EVERYWHERE</span></div>
        </section>

        <section className="preview-section container" aria-label="Studio preview">
          <div className="preview-top"><div><div className="eyebrow eyebrow-small">MEET YOUR WORKSPACE</div><h2>A clear view of the music.</h2><p>Everything you need, exactly where you expect it.</p></div><Link href="/studio" className="plain-link">Explore the studio <Icon name="arrow" size={16}/></Link></div>
          <div className="preview-frame">
            <div className="preview-toolbar"><div className="mini-window-dots"><i/><i/><i/></div><span>Practice studio · Demo track</span><span className="mini-ready">● DEMO READY</span></div>
            <div className="preview-content">
              <div className="preview-song"><span className="preview-disc"><Icon name="music" size={22}/></span><div><strong>The Open Road</strong><span>Practice progression · G major · 120 BPM</span></div><span className="preview-tag">DEMO TRACK</span></div>
              <div className="preview-wave" aria-hidden="true">{Array.from({length: 76}, (_,i)=> <span key={i} style={{height:`${12 + Math.abs(Math.sin(i*.67)*Math.cos(i*.11))*43}px`, background:i<22?"#ad805e":"#615950"}}/>)}</div>
              <div className="preview-chords"><span className="preview-chord active">G <small>0:00</small></span><span className="preview-chord">D <small>0:04</small></span><span className="preview-chord">Em <small>0:08</small></span><span className="preview-chord">C <small>0:12</small></span></div>
              <div className="preview-info"><div><small>KEY</small><strong>G Major</strong></div><div><small>TEMPO</small><strong>120 BPM</strong></div><div><small>CAPO</small><strong>None</strong></div><div><small>GUITAR SHAPE</small><strong>G</strong></div></div>
            </div>
          </div>
          <p className="preview-caption">Illustration of the studio. Open the practice demo for real playback and controls.</p>
        </section>

        <section className="feature-section" id="features">
          <div className="container">
            <div className="section-heading"><div><div className="eyebrow eyebrow-small">DESIGNED WITH PURPOSE</div><h2>Everything you need.<br/><span>Nothing you don&apos;t.</span></h2></div><p>Practical tools that help you understand a song and get back to playing guitar.</p></div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.number}>
                  <span className="feature-number">{feature.number}</span>
                  <span className="feature-icon"><Icon name={feature.icon} size={24}/></span>
                  <h3>{feature.title}</h3><p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-section container">
          <div className="section-heading how-heading"><div><div className="eyebrow eyebrow-small">A SIMPLE PROCESS</div><h2>From listening<br/><span>to playing.</span></h2></div><p>One straightforward workspace, whether you&apos;re learning your first song or exploring new ideas.</p></div>
          <div className="steps-grid">{howItWorks.map(step => <article className="step-card" key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
          <div className="final-cta"><div><div className="eyebrow eyebrow-small">LET&apos;S PLAY</div><h2>Your next favorite song<br/>starts here.</h2><p>Try a built-in original practice track and explore Fretwise now.</p></div><Link href="/studio" className="button button-accent">Open the studio <Icon name="arrow" size={18}/></Link></div>
        </section>
      </main>
      <Footer/>
    </div>
  );
}
