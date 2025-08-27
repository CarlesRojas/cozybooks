import { cn } from "@/lib/cn";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const labelVariants = cva("text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

export const Label = ({ className, ref, ...props }: ComponentProps<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
);
