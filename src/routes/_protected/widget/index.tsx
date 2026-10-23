import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { api } from "@convex/_generated/api";
import { faLinkSlash, faSpinner, faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createFileRoute } from "@tanstack/react-router";
import { useAction, useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { useEffect, useState } from "react";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/widget/")({ component: RouteComponent });

function RouteComponent() {
    // Read after mounting rather than from react-device-detect at import time, so the
    // server render and the first client render agree.
    const [isAndroid, setIsAndroid] = useState(false);
    const [deepLink, setDeepLink] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => setIsAndroid(navigator.userAgent.includes("Android")), []);

    const status = useQuery(api.widget.getWidgetTokenStatus, isAndroid ? {} : "skip");
    const mintWidgetToken = useAction(api.widget.mintWidgetToken);
    const revokeWidgetTokens = useMutation(api.widget.revokeWidgetTokens);

    const onConnect = async () => {
        setIsConnecting(true);

        try {
            const { token } = await mintWidgetToken();

            // HTTP actions live on the deployment's .convex.site sibling domain. Sending
            // it along keeps the Android code free of any hardcoded deployment.
            const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
            const apiBase = convexUrl.replace(".convex.cloud", ".convex.site");
            const link = `cozybooks://widget-setup?token=${token}&api=${encodeURIComponent(apiBase)}`;

            setDeepLink(link);
            window.location.href = link;
        } finally {
            setIsConnecting(false);
        }
    };

    const onDisconnect = async () => {
        setDeepLink(null);
        await revokeWidgetTokens();
    };

    const isConnected = (status?.tokenCount ?? 0) > 0;

    return (
        <main
            suppressHydrationWarning
            className={cn(
                "relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-6 pt-8 pb-12 lg:pt-25",
                isIOS && "mb-24",
            )}
        >
            <div className="sticky top-0 z-30 bg-neutral-50 px-6 pt-3 pb-2 lg:top-25 dark:bg-neutral-950">
                <h1 className="text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90">Home screen widget</h1>
            </div>

            <div className="flex max-w-2xl flex-col gap-4 px-6">
                <p className="font-medium tracking-wide opacity-80">
                    Keep your Reading, Want to read or Finished this year shelf on your Android home screen. Connect below, then add the
                    CozyBooks widget the way you add any other one.
                </p>

                {/* The widget is native Android code, so it can't reuse the session living
                    in Chrome's cookie jar, and there is no JS bridge inside a TWA. Pairing
                    mints a long-lived, read-only widget token and hands it to the app
                    through a cozybooks:// deep link, which the app's WidgetTokenActivity
                    catches and stores. Only Android can do any of that. */}
                {!isAndroid && (
                    <p className="font-medium tracking-wide opacity-60">
                        The widget is Android only. Open this page on your Android phone to connect it.
                    </p>
                )}

                {isAndroid && (
                    <>
                        <p className="font-medium tracking-wide opacity-60">
                            {isConnected
                                ? "The widget can show your shelves. Having trouble? Connect again to give it a fresh start."
                                : "Connecting lets the widget show your shelves. It can only read them, and you can disconnect whenever you want."}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button onClick={onConnect} disabled={isConnecting}>
                                <FontAwesomeIcon
                                    icon={isConnecting ? faSpinner : faTableCellsLarge}
                                    spin={isConnecting}
                                    className="icon mr-3"
                                />
                                <p>{isConnected ? "Connect again" : "Connect widget"}</p>
                            </Button>

                            {isConnected && (
                                <Button variant="glass" onClick={onDisconnect}>
                                    <FontAwesomeIcon icon={faLinkSlash} className="icon mr-3" />
                                    <p>Disconnect</p>
                                </Button>
                            )}
                        </div>

                        {deepLink && (
                            <p className="text-sm font-medium tracking-wide opacity-60">
                                Nothing happened?{" "}
                                <a href={deepLink} className="text-brand font-semibold underline">
                                    Tap here to finish connecting
                                </a>
                                , then add the CozyBooks widget to your home screen.
                            </p>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
