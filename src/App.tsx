import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LiffProvider } from "@/contexts/LiffContext";
import Index from "./pages/Index";
import QRCodePage from "./pages/QRCodePage";
import AboutPage from "./pages/AboutPage";
import AdminTablesPage from "./pages/AdminTablesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* QR Code page for store staff — no login required */}
          <Route path="/qrcode" element={<QRCodePage />} />
          {/* Public "about" page — shared via LIFF shareTargetPicker, NO login,
              NO gameplay. Friends who get the share link land here. */}
          <Route path="/about" element={<AboutPage />} />
          {/* Game pages — require LINE login */}
          <Route
            path="/"
            element={
              <LiffProvider>
                <Index />
              </LiffProvider>
            }
          />
          {/* Staff admin — also require LIFF login; backend then enforces
              staff_whitelist (see server/db.ts:isStaff). */}
          <Route
            path="/admin/tables"
            element={
              <LiffProvider>
                <AdminTablesPage />
              </LiffProvider>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
