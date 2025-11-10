import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatInterface from "@/components/ChatInterface";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <ChatInterface />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
