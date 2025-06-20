# Quick™ Protheus Launcher

![Header](quick_launcher.jpg)

## Visão Geral

O **Protheus Launcher** é uma aplicação desktop desenvolvida em Electron para facilitar o acesso ao sistema Protheus via navegador, garantindo que o Web Agent esteja instalado e atualizado no computador do usuário. Ele permite configuração personalizada via arquivo INI, argumentos de linha de comando e realiza automações para garantir o funcionamento correto do ambiente Protheus Web.

## Principais Mudanças e Novidades

- **Configuração por Instância**: Cada execução do launcher utiliza um diretório `userData` único, permitindo múltiplas instâncias isoladas.
- **Prioridade de Argumentos**: Parâmetros de linha de comando (`-p=PROGRAMA`, `-e=AMBIENTE`) têm prioridade sobre o arquivo INI.
- **Leitura do INI**: O launcher apenas lê o arquivo `protheus_launcher.ini` (não grava mais alterações nele).
- **Web Agent Automático**: Busca a versão e URL do instalador do Web Agent automaticamente via `webagent.json` remoto. Instala e valida a versão correta, removendo instalações antigas se necessário.
- **Loader Moderno**: Exibe tela de carregamento customizada enquanto verifica o ambiente.
- **Tratamento de Erros**: Exibe tela de erro customizada em caso de falhas críticas (ex: download, instalação, leitura de arquivos).
- **Logs Detalhados**: Todas as ações e erros relevantes são registrados em `webagent_launcher.log` dentro do diretório da instância.

## Estrutura do Projeto

- `main.js`: Código principal da aplicação Electron. Responsável por:
  - Ler configurações do arquivo `protheus_launcher.ini` e/ou argumentos de linha de comando.
  - Garantir que o Web Agent esteja instalado e atualizado, baixando e instalando automaticamente se necessário.
  - Criar a janela principal do navegador, exibindo um loader enquanto verifica o ambiente.
  - Carregar a URL do Protheus com parâmetros personalizados.
  - Gerenciar logs de execução e erros em `webagent_launcher.log`.
  - Exibir tela de erro customizada em caso de falhas.

- `package.json`: Configurações do projeto Node.js/Electron, dependências e scripts de build/start.
- `protheus_launcher.ini`: Arquivo de configuração INI editável, onde se define a URL do Protheus, programa e ambiente.
- `protheus.png`: Ícone da aplicação.
- `quick-loading.gif` e `quick-loading.svg`: Imagens de loading exibidas durante a verificação do ambiente.
- `webagent_launcher.log`: Arquivo de log gerado automaticamente pela aplicação (um por instância).

## Funcionamento

1. **Inicialização**: Ao iniciar, o launcher define um diretório de dados único para a instância e lê as configurações do arquivo INI. Caso não exista, utiliza valores padrão e cria o arquivo.
2. **Prioridade de Parâmetros**: Se argumentos de linha de comando forem passados, eles têm prioridade sobre o INI.
3. **Verificação do Web Agent**: Antes de abrir o Protheus, verifica se o Web Agent está instalado e atualizado. Busca a versão/URL mais recente via web e instala automaticamente se necessário.
4. **Loader**: Exibe uma tela de carregamento enquanto realiza as verificações.
5. **Abertura do Protheus**: Carrega a URL configurada do Protheus, incluindo parâmetros de programa e ambiente, se definidos.
6. **Logs**: Todas as ações relevantes e erros são registrados em `webagent_launcher.log`.
7. **Tratamento de Erros**: Em caso de falha crítica, exibe uma tela de erro amigável ao usuário.

## Configuração

O arquivo `protheus_launcher.ini` possui a seguinte estrutura:

```ini
[Protheus]
url=https://api.transjoi.com.br:10443/webapp/
programa=SIGAMDI
ambiente=producao
```

- **url**: Endereço base do Protheus Web.
- **programa**: Código do programa a ser aberto (opcional).
- **ambiente**: Ambiente do Protheus (opcional).

> **Nota:** O caminho do instalador do Web Agent agora é obtido automaticamente via internet. O campo `msiPath` no INI é opcional e só será usado se não houver URL remota.

## Como Executar

1. Instale as dependências:
   ```
   npm install
   ```
2. Inicie a aplicação:
   ```
   npm start
   ```
3. Parâmetros opcionais:
   - `-p=PROGRAMA` para definir o programa.
   - `-e=AMBIENTE` para definir o ambiente.

## Build

Para gerar o instalador da aplicação:
``` 
npm run dist
```
O instalador será gerado na pasta `dist/`.

## Requisitos
- Node.js
- Windows (o launcher foi projetado para ambiente Windows)

## Observações
- O launcher automatiza a instalação e atualização do Web Agent, essencial para o funcionamento do Protheus Web.
- Logs detalhados são gerados em `webagent_launcher.log` para facilitar o suporte e troubleshooting.
- O launcher pode ser executado em múltiplas instâncias simultaneamente, cada uma com seu próprio ambiente isolado.
- Em caso de erro crítico, uma tela de erro será exibida ao usuário.
