"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { submitContactMessageAction } from "@/lib/contact/actions";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  message: z.string().trim().min(10),
});

type Input = z.infer<typeof schema>;

export function ContactForm() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tMarketing = useTranslations("Marketing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit(values: Input) {
    setIsSubmitting(true);
    try {
      const result = await submitContactMessageAction(values);
      if (result.success) {
        setSent(true);
        form.reset();
      } else {
        toast.error(tCommon("somethingWentWrong"));
      }
    } catch {
      toast.error(tCommon("somethingWentWrong"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return <p className="text-muted-foreground">{tCommon("success")}</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMarketing("contactMessageLabel")}</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("loading") : tCommon("submit")}
        </Button>
      </form>
    </Form>
  );
}
