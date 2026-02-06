import { redirect } from "next/navigation";
import { auth, signIn } from "@/config/authHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const providers = [
  { id: "github", label: "GitHub", icon: <FaGithub className="h-5 w-5" /> },
  { id: "google", label: "Google", icon: <FcGoogle className="h-5 w-5" /> },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="grid place-items-center min-h-screen bg-gray-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Rudra AI Assitance</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((p) => (
            <form
              key={p.id}
              action={async () => {
                "use server";
                await signIn(p.id, { redirectTo: "/" });
              }}
            >
              <Button variant="outline" className="w-full" type="submit">
                {p.icon}
                Sign in with {p.label}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}