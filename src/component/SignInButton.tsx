import { Button } from "@/component/ui/button";
import { authClient } from "@/lib/auth/client";

interface Props {
    className?: string;
}

const SignInButton = ({ className }: Props) => {
    const login = async () => {
        await authClient.signIn.social({ provider: "google", callbackURL: `/reading` });
    };

    return (
        <Button variant="contrast" className={className} onClick={login}>
            {/* The mark is punched out of the button's own colour rather than drawn in
                Google's, the way the Google Books link elsewhere does it — a colour
                logo would be the one bright thing on an otherwise monochrome card. */}
            <div
                className="-my-1 mr-3 size-6 min-h-6 min-w-6 bg-current"
                style={{
                    maskImage: 'url("/google.png")',
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskImage: 'url("/google.png")',
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                }}
            />

            <p>Sign in with Google</p>
        </Button>
    );
};

export default SignInButton;
