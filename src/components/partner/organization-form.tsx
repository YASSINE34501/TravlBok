"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { CURRENCY_SELECT_ITEMS } from "@/lib/currency/config";
import {
  organizationSchema,
  type OrganizationInput,
} from "@/lib/validation/organization";
import {
  updateOrganizationAction,
  submitOrganizationForReviewAction,
} from "@/domains/organizations/actions";

export function OrganizationForm({
  locale,
  organizationId,
  defaultValues,
  verificationStatus,
}: {
  locale: string;
  organizationId: string;
  defaultValues: OrganizationInput;
  verificationStatus: string;
}) {
  const t = useTranslations("Partner");
  const tCommon = useTranslations("Common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; url: string }[]>([]);

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues,
  });

  async function onSubmit(values: OrganizationInput) {
    setIsSubmitting(true);
    try {
      const result = await updateOrganizationAction(locale, organizationId, values);
      if (result.success) {
        toast.success(tCommon("success"));
      } else {
        toast.error(tCommon("somethingWentWrong"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitForReview() {
    setIsReviewSubmitting(true);
    try {
      const result = await submitOrganizationForReviewAction(locale, organizationId);
      if (result.success) {
        toast.success(tCommon("success"));
      } else {
        toast.error(tCommon("somethingWentWrong"));
      }
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("businessInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("legalName")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("displayName")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registrationNumber")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("taxId")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("baseCurrency")}</FormLabel>
                      <Select
                        items={CURRENCY_SELECT_ITEMS}
                        value={field.value}
                        onValueChange={(value) => value && field.onChange(value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MAD">MAD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tCommon("loading") : tCommon("save")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("legalDocuments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FileDropzone
            locale={locale}
            purpose="LEGAL_DOCUMENT"
            organizationId={organizationId}
            multiple
            accept="image/jpeg,image/png,application/pdf"
            value={documents}
            onChange={setDocuments}
          />
        </CardContent>
      </Card>

      {verificationStatus !== "APPROVED" && (
        <Button
          size="lg"
          disabled={isReviewSubmitting}
          onClick={handleSubmitForReview}
        >
          {isReviewSubmitting ? tCommon("loading") : tCommon("submitForApproval")}
        </Button>
      )}
    </div>
  );
}
