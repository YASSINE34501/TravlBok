import { KeyRound } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getApiKeysForOrganization } from "@/domains/api-keys/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiKeyForm } from "@/components/partner/api-key-form";
import { RevokeApiKeyButton } from "@/components/partner/revoke-api-key-button";

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { organization } = await getPartnerContext(locale);

  const enabled = await hasFeature(organization.id, "featureApiAccess");
  if (!enabled) {
    return (
      <div className="space-y-4">
        <PageHeader title="API Keys" />
        <p className="text-sm text-muted-foreground">
          API access is not included in your current subscription plan. Upgrade your plan to
          generate API keys.
        </p>
      </div>
    );
  }

  const apiKeys = await getApiKeysForOrganization(organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage keys for programmatic access to your organization's data. Keep keys secret — anyone with a key can act as your organization."
      />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Generate a new key</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeyForm locale={locale} organizationId={organization.id} />
        </CardContent>
      </Card>

      {apiKeys.length === 0 ? (
        <EmptyState icon={KeyRound} title="No API keys yet" />
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <Card key={key.id} className="rounded-2xl">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
                <div>
                  <p className="font-medium text-foreground">{key.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {key.keyPrefix}… · created {key.createdAt.toLocaleDateString(locale)} ·{" "}
                    {key.lastUsedAt
                      ? `last used ${key.lastUsedAt.toLocaleDateString(locale)}`
                      : "never used"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {key.revokedAt ? (
                    <StatusBadge tone="destructive">Revoked</StatusBadge>
                  ) : (
                    <>
                      <StatusBadge tone="success">Active</StatusBadge>
                      <RevokeApiKeyButton
                        locale={locale}
                        organizationId={organization.id}
                        apiKeyId={key.id}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
