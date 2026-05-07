import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { BotRecord } from '../data/data.types';

@Injectable()
export class VerificationService {
  private readonly orgAdminUrl =
    process.env.ORG_VS_ADMIN_URL ?? 'https://admin.organization.eafit.testnet.verana.network';
  private readonly ecsTrPublicUrl =
    process.env.ECS_TR_PUBLIC_URL ?? 'https://ecs-trust-registry.testnet.verana.network';
  private readonly baseDomain =
    process.env.BASE_DOMAIN ?? 'agents.team-e.teams.eafit.testnet.verana.network';
  private readonly namespace = process.env.K8S_NAMESPACE ?? 'team-e';
  private readonly kubeconfigPath =
    process.env.KUBECONFIG_PATH ?? 'C:\\Users\\Usuario\\Desktop\\kubernets\\team_e_kubeconfig.yaml';

  async verifyServiceCredential(bot: BotRecord): Promise<void> {
    const releaseName = bot.k8sReleaseName ?? `${bot.slug}-chart`;
    const serviceName = releaseName.replace(/-chart$/, '');
    const localPort = this.randomPort();
    const childPublicUrl = `https://${bot.slug}.${this.baseDomain}`;

    const alreadyLinked = await this.hasServiceLinkedVp(childPublicUrl);
    if (alreadyLinked) return;

    const portForward = spawn(
      'kubectl',
      [
        'port-forward',
        '-n',
        this.namespace,
        `svc/${serviceName}`,
        `${localPort}:3000`,
      ],
      {
        env: { ...process.env, KUBECONFIG: this.kubeconfigPath },
        stdio: 'ignore',
      },
    );

    const cleanup = () => {
      if (!portForward.killed) {
        portForward.kill();
      }
    };

    try {
      await this.waitForAgent(`http://localhost:${localPort}/v1/agent`, 30);

      const childAgent = await this.fetchJson<{ publicDid: string }>(
        `http://localhost:${localPort}/v1/agent`,
      );
      const childDid = childAgent.publicDid;
      if (!childDid) {
        throw new InternalServerErrorException('No se pudo obtener DID del agente desplegado.');
      }

      const serviceJscUrl = await this.discoverServiceJscUrl();
      const logoDataUri = await this.downloadLogoAsDataUri(
        bot.persona.photoUrl || 'https://hologram.zone/images/github.svg',
      );

      const claims = {
        id: childDid,
        name: bot.service.name || bot.persona.name,
        type: 'AIAgent',
        description: bot.service.description,
        logo: logoDataUri,
        minimumAgeRequired: 0,
        termsAndConditions: 'https://verana.io/terms',
        privacyPolicy: 'https://verana.io/privacy',
      };

      const issued = await this.fetchJson<{ credential?: unknown }>(
        `${this.orgAdminUrl}/v1/vt/issue-credential`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'jsonld',
            did: childDid,
            jsonSchemaCredentialId: serviceJscUrl,
            claims,
          }),
        },
      );

      const signedCredential = issued.credential ?? issued;

      await fetch(`http://localhost:${localPort}/v1/vt/linked-credentials`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialSchemaId: serviceJscUrl }),
      });

      await this.fetchJson(`http://localhost:${localPort}/v1/vt/linked-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaBaseId: 'service',
          credential: signedCredential,
        }),
      });
    } finally {
      cleanup();
    }
  }

  private async discoverServiceJscUrl() {
    const didDoc = await this.fetchJson<{ service: Array<{ id: string; type: string; serviceEndpoint: string }> }>(
      `${this.ecsTrPublicUrl}/.well-known/did.json`,
    );
    const serviceEntry = didDoc.service.find(
      (entry) => entry.type === 'LinkedVerifiablePresentation' && entry.id.includes('service-jsc-vp'),
    );
    if (!serviceEntry) {
      throw new InternalServerErrorException('No se encontró service-jsc-vp en ECS Trust Registry.');
    }

    const vp = await this.fetchJson<{ verifiableCredential?: Array<{ id?: string }> }>(
      serviceEntry.serviceEndpoint,
    );
    const serviceJscUrl = vp.verifiableCredential?.[0]?.id;
    if (!serviceJscUrl) {
      throw new InternalServerErrorException('No se pudo extraer jsonSchemaCredentialId de service-jsc-vp.');
    }
    return serviceJscUrl;
  }

  private async hasServiceLinkedVp(publicUrl: string) {
    try {
      const didDoc = await this.fetchJson<{ service?: Array<{ id: string; type: string }> }>(
        `${publicUrl}/.well-known/did.json`,
      );
      return !!didDoc.service?.some(
        (entry) => entry.type === 'LinkedVerifiablePresentation' && entry.id.includes('service-jsc-vp'),
      );
    } catch {
      return false;
    }
  }

  private async downloadLogoAsDataUri(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new InternalServerErrorException(`No se pudo descargar logo desde ${url}`);
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${bytes.toString('base64')}`;
  }

  private async waitForAgent(url: string, maxRetries: number) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return;
      } catch {
        // noop
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new InternalServerErrorException('Timeout esperando VS Agent para verificación.');
  }

  private randomPort() {
    return 3100 + Math.floor(Math.random() * 300);
  }

  private async fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Error HTTP ${response.status} en ${url}: ${text}`);
    }
    return (await response.json()) as T;
  }
}
