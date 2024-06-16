"use client";

import { signInWithGoogle } from "@/auth/actions";
import { Button } from "@/components/ui/button";

const SignInButton = () => {
    return <Button onClick={async () => await signInWithGoogle()}>Continue</Button>;
};

export default SignInButton;
