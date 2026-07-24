import { getPartnerContext } from "@/lib/partner-context";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getApiKeysForOrganization } from "@/domains/api-keys/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <h1 className="text-2xl font-semibold">API Keys</h1>
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
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <p className="text-sm text-muted-foreground">
        Manage keys for programmatic access to your organization&apos;s data. Keep keys secret —
        anyone with a key can act as your organization.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate a new key</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeyForm locale={locale} organizationId={organization.id} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {apiKeys.map((key) => (
          <Card key={key.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  {key.keyPrefix}… · created {key.createdAt.toLocaleDateString(locale)} ·{" "}
                  {key.lastUsedAt ? `last used ${key.lastUsedAt.toLocaleDateString(locale)}` : "never used"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {key.revokedAt ? (
                  <Badge variant="destructive">Revoked</Badge>
                ) : (
                  <>
                    <Badge variant="default">Active</Badge>
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
        {apiKeys.length === 0 && (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        )}
      </div>
    </div>
  );
}
