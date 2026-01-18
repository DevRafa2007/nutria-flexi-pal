import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { ImmersiveScroll } from "@/components/ImmersiveScroll";

import PageTransition from "@/components/PageTransition";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

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
