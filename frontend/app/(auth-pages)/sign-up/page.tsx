import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { SmtpMessage } from "../smtp-message";

export default function Signup({ searchParams }: { searchParams: Message }) {
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your email and choose a password to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <SubmitButton className="w-full" formAction={async (formData) => {
            const result = await signUpAction(formData);
            if (result.error) {
              // Handle the error, e.g., display it to the user
              console.error(result.error);
            }
          }} pendingText="Signing up...">
            Sign up
          </SubmitButton>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">
              <FaGoogle className="mr-2 h-4 w-4" /> Google
            </Button>
            <Button variant="outline" type="button">
              <FaGithub className="mr-2 h-4 w-4" /> GitHub
            </Button>
          </div>
        </div>
        
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="text-primary hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        
        <FormMessage message={searchParams} />
      </CardContent>
      <SmtpMessage />
    </Card>
  );
}
