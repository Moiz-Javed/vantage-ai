import { SignUp } from "@clerk/clerk-react";
import VantageMark from "../components/VantageMark";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex items-center gap-2">
        <VantageMark size={28} animated />
        <span className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
          Vantage AI
        </span>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
