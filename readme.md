# Protheus Launcher

## Vis�o Geral

O **Protheus Launcher** � uma aplica��o desktop desenvolvida em Electron para facilitar o acesso ao sistema Protheus via navegador, garantindo que o Web Agent esteja instalado e atualizado no computador do usu�rio. Ele permite configura��o personalizada via arquivo INI e realiza automa��es para garantir o funcionamento correto do ambiente Protheus Web.

## Estrutura do Projeto

- `main.js`: C�digo principal da aplica��o Electron. Respons�vel por:
  - Ler e gravar configura��es do arquivo `protheus_launcher.ini`.
  - Garantir que o Web Agent esteja instalado e atualizado, baixando e instalando automaticamente se necess�rio.
  - Criar a janela principal do navegador, exibindo um loader enquanto verifica o ambiente.
  - Carregar a URL do Protheus com par�metros personalizados.
  - Limpar cookies, dados de sess�o e service workers antes de abrir o sistema.
  - Gerenciar logs de execu��o e erros em `webagent_launcher.log`.

- `package.json`: Configura��es do projeto Node.js/Electron, depend�ncias e scripts de build/start.
- `protheus_launcher.ini`: Arquivo de configura��o INI edit�vel, onde se define a URL do Protheus, programa, ambiente e caminho do instalador do Web Agent.
- `protheus.png`: �cone da aplica��o.
- `quick-loading.gif` e `quick-loading.svg`: Imagens de loading exibidas durante a verifica��o do ambiente.
- `webagent_launcher.log`: Arquivo de log gerado automaticamente pela aplica��o.

## Funcionamento

1. **Inicializa��o**: Ao iniciar, o launcher l� as configura��es do arquivo INI. Caso n�o exista, utiliza valores padr�o.
2. **Verifica��o do Web Agent**: Antes de abrir o Protheus, verifica se o Web Agent est� instalado e atualizado. Se necess�rio, baixa e instala automaticamente.
3. **Loader**: Exibe uma tela de carregamento enquanto realiza as verifica��es.
4. **Limpeza de Sess�o**: Limpa cookies, dados de sess�o e service workers para evitar problemas de cache.
5. **Abertura do Protheus**: Carrega a URL configurada do Protheus, incluindo par�metros de programa e ambiente, se definidos.
6. **Logs**: Todas as a��es relevantes e erros s�o registrados em `webagent_launcher.log`.

## Configura��o

O arquivo `protheus_launcher.ini` possui a seguinte estrutura:

```ini
[Protheus]
url=https://api.transjoi.com.br:10443/webapp/
programa=SIGAMDI
ambiente=producao
msiPath=\\quick.transjoi.com.br\webagent\web-agent-1.0.17-windows-x64-release.setup.exe
```

- **url**: Endere�o base do Protheus Web.
- **programa**: C�digo do programa a ser aberto (opcional).
- **ambiente**: Ambiente do Protheus (opcional).
- **msiPath**: Caminho do instalador do Web Agent.

## Como Executar

1. Instale as depend�ncias:
   ```
   npm install
   ```
2. Inicie a aplica��o:
   ```
   npm start
   ```

## Build

Para gerar o instalador da aplica��o:
``` 
npm run dist
```
O instalador ser� gerado na pasta `dist/`.

## Requisitos
- Node.js
- Windows (o launcher foi projetado para ambiente Windows)

## Observa��es
- O launcher automatiza a instala��o e atualiza��o do Web Agent, essencial para o funcionamento do Protheus Web.
- Logs detalhados s�o gerados em `webagent_launcher.log` para facilitar o suporte e troubleshooting.
