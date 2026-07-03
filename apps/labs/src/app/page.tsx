import { Reveal } from "@lmlabs/ui";
import { Hero } from "./Hero";
import { ExperimentsShowcase } from "./ExperimentsShowcase";
// import { ContactForm } from "./ContactForm"; // hidden for now
import { StayConnected } from "./StayConnected";
import { SiteFooter } from "./SiteFooter";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <main>
        <Hero />

        <ExperimentsShowcase />

        <section className={styles.section} id="stay-connected">
          <Reveal>
            <StayConnected />
          </Reveal>
        </section>

        {/* Get in touch section hidden for now
        <section className={styles.section} id="contact">
          <Reveal>
            <ContactForm />
          </Reveal>
        </section>
        */}
      </main>
      <SiteFooter />
    </>
  );
}
