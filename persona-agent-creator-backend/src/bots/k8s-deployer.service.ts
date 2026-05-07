import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawnSync } from 'node:child_process';
import { BotRecord } from '../data/data.types';

type DeploymentInput = {
  bot: BotRecord;
  generatedPath: string;
  releaseName: string;
};

@Injectable()
export class K8sDeployerService {
  private readonly namespace = process.env.K8S_NAMESPACE ?? 'team-e';
  private readonly kubeconfigPath =
    process.env.KUBECONFIG_PATH ?? 'C:\\Users\\Usuario\\Desktop\\kubernets\\team_e_kubeconfig.yaml';
  private readonly chartSource =
    process.env.AGENT_CHART_SOURCE ?? 'oci://registry-1.docker.io/io2060/hologram-generic-ai-agent-chart';
  private readonly chartVersion = process.env.AGENT_CHART_VERSION ?? 'v1.11.2';

  private readonly openaiApiKey = process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY ?? '';
  private readonly postgresPassword = process.env.EXAMPLE_AGENT_POSTGRES_PASSWORD ?? '';
  private readonly walletKey = process.env.EXAMPLE_AGENT_WALLET_KEY ?? '';
  private readonly mcpEncryptionKey = process.env.EXAMPLE_AGENT_MCP_CONFIG_ENCRYPTION_KEY ?? '';
  private readonly vsAgentDbPassword = process.env.EXAMPLE_AGENT_VSAGENT_DB_PASSWORD ?? '';

  deploy(input: DeploymentInput) {
    this.ensureRequiredEnv();

    const env = { ...process.env, KUBECONFIG: this.kubeconfigPath };
    const configMapName = `${input.releaseName}-agent-pack`;
    const valuesPath = `${input.generatedPath}/deployment.yaml`;
    const agentPackPath = `${input.generatedPath}/agent-pack.yaml`;
    const vsAgentServiceName = input.releaseName.replace(/-chart$/, '');

    this.runCommand(
      `kubectl create namespace ${this.namespace} --dry-run=client -o yaml | kubectl apply -f -`,
      env,
    );

    this.runCommand(
      `kubectl create secret generic ${vsAgentServiceName}-db-secret --namespace ${this.namespace} --from-literal=POSTGRES_PASSWORD=${this.vsAgentDbPassword} --dry-run=client -o yaml | kubectl apply -f -`,
      env,
    );

    this.runCommand(
      `kubectl create secret generic postgres-secret --namespace ${this.namespace} --from-literal=POSTGRES_PASSWORD=${this.postgresPassword} --dry-run=client -o yaml | kubectl apply -f -`,
      env,
    );

    this.runCommand(
      `kubectl create configmap ${configMapName} --namespace ${this.namespace} --from-file=agent-pack.yaml="${agentPackPath}" --dry-run=client -o yaml | kubectl apply -f -`,
      env,
    );

    this.runCommand(
      `helm upgrade --install ${input.releaseName} ${this.chartSource} --version ${this.chartVersion} --namespace ${this.namespace} --values "${valuesPath}" --set chatbot.secret.OPENAI_API_KEY=${this.openaiApiKey} --set chatbot.secret.MCP_CONFIG_ENCRYPTION_KEY=${this.mcpEncryptionKey} --set chatbot.secret.POSTGRES_USER=example-db-user --set chatbot.secret.POSTGRES_DB_NAME=example-db-name --set chatbot.secret.POSTGRES_PASSWORD=${this.postgresPassword} --set vs-agent-chart.extraEnv[1].value=${this.walletKey} --wait --timeout 300s`,
      env,
    );

    return { namespace: this.namespace, releaseName: input.releaseName };
  }

  undeploy(releaseName: string) {
    const env = { ...process.env, KUBECONFIG: this.kubeconfigPath };
    this.runCommand(
      `helm uninstall ${releaseName} --namespace ${this.namespace} --wait --timeout 180s`,
      env,
    );
  }

  private ensureRequiredEnv() {
    const missing: string[] = [];
    if (!this.openaiApiKey) missing.push('OPENAI_API_KEY (o GROQ_API_KEY)');
    if (!this.postgresPassword) missing.push('EXAMPLE_AGENT_POSTGRES_PASSWORD');
    if (!this.walletKey) missing.push('EXAMPLE_AGENT_WALLET_KEY');
    if (!this.mcpEncryptionKey) missing.push('EXAMPLE_AGENT_MCP_CONFIG_ENCRYPTION_KEY');
    if (!this.vsAgentDbPassword) missing.push('EXAMPLE_AGENT_VSAGENT_DB_PASSWORD');

    if (missing.length > 0) {
      throw new InternalServerErrorException(
        `Faltan variables de despliegue: ${missing.join(', ')}`,
      );
    }
  }

  private runCommand(command: string, env: NodeJS.ProcessEnv) {
    const result = spawnSync(command, {
      env,
      encoding: 'utf-8',
      shell: true,
    });

    if (result.status !== 0) {
      throw new InternalServerErrorException(
        `Error ejecutando "${command}": ${result.stderr || result.stdout}`,
      );
    }
    return result;
  }
}
