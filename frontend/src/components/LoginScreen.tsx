import LoginButton from './LoginButton';
import { Flame, Zap, Target, TrendingUp } from 'lucide-react';

const features = [
  { icon: Flame, text: "Today's personalized workout" },
  { icon: Target, text: 'Custom weekly schedule' },
  { icon: TrendingUp, text: 'Progress & streak tracking' },
  { icon: Zap, text: 'Daily motivational messages' },
];

export default function LoginScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-glow">
            <img
              src="/assets/generated/app-logo.dim_256x256.png"
              alt="Daily Grind"
              className="w-14 h-14 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl">🔥</span>';
              }}
            />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Daily<span className="text-primary">Grind</span>
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Your personal workout companion
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 text-left">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <LoginButton />
          <p className="text-xs text-muted-foreground">
            Secure login via Internet Identity. No password needed.
          </p>
        </div>
      </div>
    </div>
  );
}
