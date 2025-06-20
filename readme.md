# Protheus Launcher

## Visão Geral

O **Protheus Launcher** é uma aplicação desktop desenvolvida em Electron para facilitar o acesso ao sistema Protheus via navegador, garantindo que o Web Agent esteja instalado e atualizado no computador do usuário. Ele permite configuração personalizada via arquivo INI e realiza automações para garantir o funcionamento correto do ambiente Protheus Web.

## Estrutura do Projeto

- `main.js`: Código principal da aplicação Electron. Responsável por:
  - Ler e gravar configurações do arquivo `protheus_launcher.ini`.
  - Garantir que o Web Agent esteja instalado e atualizado, baixando e instalando automaticamente se necessário.
  - Criar a janela principal do navegador, exibindo um loader enquanto verifica o ambiente.
  - Carregar a URL do Protheus com parâmetros personalizados.
  - Limpar cookies, dados de sessão e service workers antes de abrir o sistema.
  - Gerenciar logs de execução e erros em `webagent_launcher.log`.

- `package.json`: Configurações do projeto Node.js/Electron, dependências e scripts de build/start.
- `protheus_launcher.ini`: Arquivo de configuração INI editável, onde se define a URL do Protheus, programa, ambiente e caminho do instalador do Web Agent.
- `protheus.png`: Ícone da aplicação.
- `quick-loading.gif` e `quick-loading.svg`: Imagens de loading exibidas durante a verificação do ambiente.
- `webagent_launcher.log`: Arquivo de log gerado automaticamente pela aplicação.

## Funcionamento

1. **Inicialização**: Ao iniciar, o launcher lê as configurações do arquivo INI. Caso não exista, utiliza valores padrão.
2. **Verificação do Web Agent**: Antes de abrir o Protheus, verifica se o Web Agent está instalado e atualizado. Se necessário, baixa e instala automaticamente.
3. **Loader**: Exibe uma tela de carregamento enquanto realiza as verificações.
4. **Limpeza de Sessão**: Limpa cookies, dados de sessão e service workers para evitar problemas de cache.
5. **Abertura do Protheus**: Carrega a URL configurada do Protheus, incluindo parâmetros de programa e ambiente, se definidos.
6. **Logs**: Todas as ações relevantes e erros são registrados em `webagent_launcher.log`.

## Configuração

O arquivo `protheus_launcher.ini` possui a seguinte estrutura:

```ini
[Protheus]
url=https://api.transjoi.com.br:10443/webapp/
programa=SIGAMDI
ambiente=producao
msiPath=\\quick.transjoi.com.br\webagent\web-agent-1.0.17-windows-x64-release.setup.exe
```

- **url**: Endereço base do Protheus Web.
- **programa**: Código do programa a ser aberto (opcional).
- **ambiente**: Ambiente do Protheus (opcional).
- **msiPath**: Caminho do instalador do Web Agent.

## Como Executar

1. Instale as dependências:
   ```
   npm install
   ```
2. Inicie a aplicação:
   ```
   npm start
   ```

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
