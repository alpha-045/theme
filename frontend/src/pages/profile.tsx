import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/contexts/RoleContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateAccount, token } = useRole();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="animate-fade-in max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Please login to view your profile.</div>
            <div className="mt-4">
              <Button onClick={() => navigate("/login")}>Go to login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const patch: Partial<{ name: string; email: string; password: string }> = {};
      if (name.trim() && name.trim() !== user?.name) patch.name = name.trim();
      if (email.trim() && email.trim() !== user?.email) patch.email = email.trim();
      if (password.trim()) patch.password = password;
      await updateAccount(patch);
      setPassword("");
      setSuccess("Account updated.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
              {success}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty to keep current password"
            />
          </div>

          <Button className="w-full" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

