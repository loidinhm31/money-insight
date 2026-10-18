import {
  ChevronRight,
  Layers,
  LogIn,
  Palette,
  Sun,
  Moon,
  Laptop,
  Terminal,
} from "lucide-react";
import { useAuth, useNav } from "../../hooks";
import { useTheme, type Theme } from "../../contexts";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../atoms";
import { SyncSettings } from "../organisms";
import { MobileHeader } from "../molecules";
interface SettingsPageProps {
  onBack?: () => void;
  onLogout?: () => void;
}

/**
 * Settings page with browser mode and app info
 */
export function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const { navigate } = useNav();
  const { isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] =
    [
      { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
      { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
      {
        value: "system",
        label: "System",
        icon: <Laptop className="h-4 w-4" />,
      },
      {
        value: "cyber",
        label: "Cyber",
        icon: <Terminal className="h-4 w-4" />,
      },
    ];
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <MobileHeader title="Settings" showBack={!!onBack} onBack={onBack} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Theme</CardTitle>
                <CardDescription>
                  Choose your preferred appearance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    theme === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  {option.icon}
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Login Settings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isAuthenticated ? "Account" : "Login to connect to server"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated
                    ? "Manage your account connection"
                    : "Connect your account to sync data across devices"}
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  await logout();
                  onLogout?.();
                }}
              >
                Logout
              </Button>
            ) : (
              <Button
                variant="default"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Login / Register
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Category Setup */}
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate("/categories")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Category Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Group categories for better analysis
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <SyncSettings />
      </div>
    </div>
  );
}
