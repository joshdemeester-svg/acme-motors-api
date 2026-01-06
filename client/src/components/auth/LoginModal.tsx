import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Lock, Phone, ArrowLeft, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"select" | "seller" | "admin">("select");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendCodeMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const res = await fetch("/api/seller/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send code");
      }
      return res.json();
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({
        title: "Code Sent",
        description: "Check your phone for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifySellerMutation = useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const res = await fetch("/api/seller/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Verification failed");
      }
      return res.json();
    },
    onSuccess: () => {
      onOpenChange(false);
      resetState();
      setLocation("/seller-portal");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      onOpenChange(false);
      resetState();
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetState = () => {
    setMode("select");
    setPhone("");
    setVerificationCode("");
    setCodeSent(false);
    setUsername("");
    setPassword("");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-2xl">
            {mode === "select" && "Welcome"}
            {mode === "seller" && "Vehicle Owner Login"}
            {mode === "admin" && "Staff Login"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "select" && "Choose how you would like to log in"}
            {mode === "seller" && "Enter your phone number to access your consignment"}
            {mode === "admin" && "Enter your credentials to access the admin panel"}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" && (
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              How would you like to log in?
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex items-center gap-4 justify-start"
                onClick={() => setMode("seller")}
                data-testid="btn-seller-login"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Vehicle Owner</div>
                  <div className="text-sm text-muted-foreground">Check your consignment status</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex items-center gap-4 justify-start"
                onClick={() => setMode("admin")}
                data-testid="btn-admin-login"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Staff Login</div>
                  <div className="text-sm text-muted-foreground">Admin access</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {mode === "seller" && (
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => { setMode("select"); setCodeSent(false); }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            {!codeSent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the phone number you used when submitting your vehicle.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="seller-phone">Cell Phone</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="seller-phone"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                        className="pl-10"
                        data-testid="input-seller-phone"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => sendCodeMutation.mutate(phone)}
                  disabled={phone.replace(/\D/g, "").length < 10 || sendCodeMutation.isPending}
                  data-testid="btn-send-seller-code"
                >
                  {sendCodeMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to {phone}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    data-testid="input-seller-code"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => verifySellerMutation.mutate({ phone, code: verificationCode })}
                  disabled={verificationCode.length !== 6 || verifySellerMutation.isPending}
                  data-testid="btn-verify-seller"
                >
                  {verifySellerMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => sendCodeMutation.mutate(phone)}
                  disabled={sendCodeMutation.isPending}
                >
                  Resend Code
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === "admin" && (
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => setMode("select")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-admin-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => adminLoginMutation.mutate({ username, password })}
                disabled={!username || !password || adminLoginMutation.isPending}
                data-testid="btn-admin-submit"
              >
                {adminLoginMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging in...</>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
