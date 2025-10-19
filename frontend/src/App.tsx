import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PeopleList from "./pages/people/PeopleList";
import CreatePerson from "./pages/people/CreatePerson";
import BiometricsList from "./pages/biometrics/BiometricsList";
import BiometricLogs from "./pages/logs/BiometricLogs";
import WebAccessLogs from "./pages/logs/WebAccessLogs";
import UnitsList from "./pages/units/UnitsList";
import Settings from "./pages/settings/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="people" element={<PeopleList />} />
            <Route path="people/create" element={<CreatePerson />} />
            <Route path="people/students" element={<PeopleList />} />
            <Route path="people/employees" element={<PeopleList />} />
            <Route path="people/visitors" element={<PeopleList />} />
            <Route path="biometrics" element={<BiometricsList />} />
            <Route path="logs" element={<Navigate to="/logs/biometric" replace />} />
            <Route path="logs/biometric" element={<BiometricLogs />} />
            <Route path="logs/web" element={<WebAccessLogs />} />
            <Route path="units" element={<UnitsList />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
