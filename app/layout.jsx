import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import AddBootstrap from "./components/BootstrapClient";
import AppShell from "./components/AppShell";
import GlobalSendProgress from "./components/GlobalSendProgress";
import { ToastProvider } from "./components/Toast";

export const metadata = {
  title: "MailDeck — Email Operations Console",
  description: "Send, track, and manage bulk emails with campaigns, analytics, and audience tools.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AddBootstrap />
        <ToastProvider>
          <AppShell>{children}</AppShell>
          <GlobalSendProgress />
        </ToastProvider>
      </body>
    </html>
  );
}
