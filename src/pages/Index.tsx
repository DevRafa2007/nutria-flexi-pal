import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { ImmersiveScroll } from "@/components/ImmersiveScroll";

import PageTransition from "@/components/PageTransition";

const Index = () => {
  return (
    <PageTransition>
      <div className="bg-background">
        <ImmersiveScroll>
          <Hero />
          <Features />
          <CTA />
        </ImmersiveScroll>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
