import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaGoogle, FaGithub } from 'react-icons/fa';

export default function Login({ searchParams }: { searchParams: Message }) {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <form className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link className="text-sm text-primary hover:underline" href="/forgot-password">
                Forgot Password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <SubmitButton className="w-full" pendingText="Signing In..." formAction={signInAction}>
            Sign in
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
          Don't have an account?{" "}
          <Link className="text-primary hover:underline" href="/sign-up">
            Sign up
          </Link>
        </p>
        
        <FormMessage message={searchParams} />
      </CardContent>
    </Card>
  );
}
