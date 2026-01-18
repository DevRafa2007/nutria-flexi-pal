import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { LogOut, Menu } from "lucide-react";
import StreakIndicator from "./StreakIndicator";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardHeaderProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardHeader = ({ currentTab, onTabChange }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
    setIsMenuOpen(false);
    navigate("/");
    window.scrollTo(0, 0);
  };

  const handleTabSelect = (tab: string) => {
    onTabChange?.(tab);
    setIsMenuOpen(false);
  };

  const tabs = [
    { value: "meals", label: "🍽️ Minhas Refeições", icon: "🍽️" },
    { value: "chat", label: "🍴 Monte sua Dieta", icon: "🍴" },
    { value: "progress", label: "📊 Progresso", icon: "📊" },
    { value: "profile", label: "👤 Perfil", icon: "👤" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            myNutrIA
          </h2>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center">
          <div className="relative flex p-1 bg-muted/30 rounded-full">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabChange?.(tab.value)}
                  className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="dashboard-tab-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      className="absolute inset-0 bg-background shadow-md border border-black/5 rounded-full"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className={isActive ? "font-semibold" : ""}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <StreakIndicator />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hidden sm:flex"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {tabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={currentTab === tab.value ? "default" : "ghost"}
                    className="justify-start w-full"
                    onClick={() => handleTabSelect(tab.value)}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label.replace(/^[^\s]+\s/, "")}
                  </Button>
                ))}
                <div className="border-t my-4" />
                <Button
                  variant="ghost"
                  className="justify-start w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
