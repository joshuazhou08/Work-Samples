import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { BillingStatusWatcher } from "@/components/providers/BillingStatusWatcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CalTutors",
  description: "Tutoring services for UC Berkeley students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} m-0 p-0 min-h-full`}>
        <div className="min-h-full bg-gradient-to-br from-white via-blue-50/30 to-white relative">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large floating orbs */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.15] animate-float"></div>
            <div className="absolute top-1/4 -right-40 w-[32rem] h-[32rem] bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.12] animate-float animation-delay-2000"></div>
            <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] bg-gradient-to-br from-blue-300 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.1] animate-float animation-delay-4000"></div>

            {/* Medium ambient orbs */}
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full mix-blend-multiply filter blur-2xl opacity-[0.08] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-[0.09] animate-pulse-slow animation-delay-3000"></div>

            {/* Subtle shimmer effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-50/10 to-transparent animate-shimmer"></div>

            {/* Small accent dots */}
            <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-[0.06] animate-drift"></div>
            <div className="absolute top-2/3 left-1/5 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-[0.05] animate-drift animation-delay-1000"></div>
            <div className="absolute top-1/4 right-1/4 w-36 h-36 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-[0.05] animate-drift animation-delay-5000"></div>
          </div>

          <div className="relative z-10">
            <QueryProvider>
              <NotificationProvider>
                <AuthProvider>
                  <BillingStatusWatcher />
                  {children}
                </AuthProvider>
              </NotificationProvider>
            </QueryProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
