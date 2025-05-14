# Sistema de Leitura de Dados da Balanca

Este é um sistema desenvolvido em Node.js que lê dados de sensores conectados a portas seriais e disponibiliza essas informações via HTTP ou Server-Sent Events (SSE). O servidor permite monitorar os valores da balança em tempo real.

## Funcionalidades

- Lê dados das portas seriais (`/dev/ttyS4`, `/dev/ttyS5`).
- Exibe dados via HTTP simples ou por SSE.
- Possui uma interface web que pode ser acessada no navegador.
- Reinicia automaticamente caso a conexão serial seja perdida.

## Pré-requisitos

- **Ubuntu 18.10** ou versão superior.
- **Node.js v20.10.0** (ou versão compatível).
- **PM2** para gerenciar o processo da aplicação.

---

## Passo a Passo de Instalação e Configuração

### 1. **Configurar IP Estático na Máquina**

Para configurar um IP estático, edite o arquivo de configuração do `netplan`:

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Adicione a configuração para o IP estático, substituindo os valores conforme necessário:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp2s0:
      dhcp4: false
      addresses:
        - 192.168.10.10/24
      gateway4: 192.168.10.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

Depois de editar o arquivo, aplique as mudanças:

```bash
sudo netplan apply
```

### 2. **Instalar o NVM (Node Version Manager)**

Baixe e instale o NVM para gerenciar versões do Node.js:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```

Recarregue o terminal:

```bash
source ~/.bashrc
```

Verifique a instalação do NVM:

```bash
nvm -v
```

### 3. **Instalar o Node.js**

Instale a versão do Node.js desejada (neste caso, v20.10.0):

```bash
nvm install 20.10.0
nvm use 20.10.0
nvm alias default 20.10.0
```

### 4. **Instalar as Dependências do Projeto**

Agora, baixe as dependências do projeto. Primeiro, acesse a pasta do projeto:

```bash
cd /home/seges/gessointegral-balanca
```

Instale as dependências listadas no `package.json`:

```bash
npm install
```

### 5. **Verificar a Porta Serial**

Verifique as portas seriais disponíveis no seu sistema. Use o comando abaixo para verificar se a porta está acessível:

```bash
ls /dev/ttyS*
```

Testando a leitura de dados na porta serial (substitua o caminho da porta conforme necessário):

```bash
cat /dev/ttyS4
```

### 6. **Instalar o PM2**

O PM2 é usado para gerenciar o processo da aplicação. Instale o PM2 globalmente:

```bash
npm install pm2@latest -g
```

### 7. **Configurar o PM2 para Iniciar com o Sistema**

Para garantir que o PM2 seja iniciado automaticamente quando o sistema for rineciad reiniciado, siga estas etapas:

1. Execute o comando a seguir para configurar o PM2 para iniciar com o sistema (isso cria um script de inicialização):

   ```bash
   pm2 startup
   ```

   Isso irá gerar um comando que você precisará executar. A saída será parecida com:

   ```swift
   [PM2] Init System found: systemd
   [PM2] To setup the Startup Script, copy/paste the following command:
   sudo env PATH=$PATH:/home/seges/.nvm/versions/node/v20.10.0/bin /home/seges/.nvm/versions/node/v20.10.0/lib/node_modules/pm2/bin/pm2 startup systemd -u seges --hp /home/seges
   ```

2. Copie o comando gerado pela saída do comando acima e execute-o no terminal:
   `❌🚫_tem que ser o codigo gerado pelo comando acimar!_`

   ```bash
   ex: sudo env PATH=$PATH:/home/seges/.nvm/versions/node/v20.10.0/bin /home/seges/.nvm/versions/node/v20.10.0/lib/node_modules/pm2/bin/pm2 startup systemd -u seges --hp /home/seges
   ```

Esse comando gera um script para garantir que o PM2 seja executado no início do sistema.

### 8. **Salvar o Estado do PM2**

Depois de configurar o PM2, salve o estado atual dos processos para que o PM2 os restaure após reiniciar o sistema:

```bash
pm2 save
```

### 9. **Reiniciar o Sistema**

Reinicie o sistema para testar se o PM2 inicia corretamente na inicialização:

```bash
sudo reboot
```

### 10. **Verificar se a Aplicação Está em Execução**

Após o reinício, verifique se o PM2 está executando os processos corretamente:

```bash
pm2 list
```

Isso deve exibir a lista de processos gerenciados pelo PM2, incluindo a aplicação `balanca`.

---

## Como Acessar a Aplicação

A aplicação estará disponível na porta configurada (por padrão, porta **3000**). Você pode acessar a interface web ou usar os endpoints da API HTTP.

### Endpoints da API

- **API HTTP** (disponível na porta 3000):
  - Acesse os dados como texto simples: `http://<ip-do-servidor>:3000`
  - Acesse os dados via SSE: `http://<ip-do-servidor>:3000` (SSE)

---

## Estrutura do Projeto

- `index.js`: Código principal da aplicação que lida com a leitura das portas seriais e disponibiliza os dados via HTTP ou SSE.
- `ecosystem.config.js`: Configuração do PM2 para gerenciar a aplicação.
- `index.html`: Interface simples para exibição dos dados da balança.

## Dependências

- `serialport`: Biblioteca para interação com portas seriais.
- `http`: Módulo nativo do Node.js para criar o servidor HTTP.
- `fs`: Módulo nativo do Node.js para trabalhar com o sistema de arquivos.

```

```
