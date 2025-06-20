# Quick� Protheus Launcher

![Header](quick_launcher.jpg)

## Vis�o Geral

O **Protheus Launcher** � uma aplica��o desktop desenvolvida em Electron para facilitar o acesso ao sistema Protheus via navegador, garantindo que o Web Agent esteja instalado e atualizado no computador do usu�rio. Ele permite configura��o personalizada via arquivo INI, argumentos de linha de comando e realiza automa��es para garantir o funcionamento correto do ambiente Protheus Web.

## Principais Mudan�as e Novidades

- **Configura��o por Inst�ncia**: Cada execu��o do launcher utiliza um diret�rio `userData` �nico, permitindo m�ltiplas inst�ncias isoladas.
- **Prioridade de Argumentos**: Par�metros de linha de comando (`-p=PROGRAMA`, `-e=AMBIENTE`) t�m prioridade sobre o arquivo INI.
- **Leitura do INI**: O launcher apenas l� o arquivo `protheus_launcher.ini` (n�o grava mais altera��es nele).
- **Web Agent Autom�tico**: Busca a vers�o e URL do instalador do Web Agent automaticamente via `webagent.json` remoto. Instala e valida a vers�o correta, removendo instala��es antigas se necess�rio.
- **Loader Moderno**: Exibe tela de carregamento customizada enquanto verifica o ambiente.
- **Tratamento de Erros**: Exibe tela de erro customizada em caso de falhas cr�ticas (ex: download, instala��o, leitura de arquivos).
- **Logs Detalhados**: Todas as a��es e erros relevantes s�o registrados em `webagent_launcher.log` dentro do diret�rio da inst�ncia.

## Estrutura do Projeto

- `main.js`: C�digo principal da aplica��o Electron. Respons�vel por:
  - Ler configura��es do arquivo `protheus_launcher.ini` e/ou argumentos de linha de comando.
  - Garantir que o Web Agent esteja instalado e atualizado, baixando e instalando automaticamente se necess�rio.
  - Criar a janela principal do navegador, exibindo um loader enquanto verifica o ambiente.
  - Carregar a URL do Protheus com par�metros personalizados.
  - Gerenciar logs de execu��o e erros em `webagent_launcher.log`.
  - Exibir tela de erro customizada em caso de falhas.

- `package.json`: Configura��es do projeto Node.js/Electron, depend�ncias e scripts de build/start.
- `protheus_launcher.ini`: Arquivo de configura��o INI edit�vel, onde se define a URL do Protheus, programa e ambiente.
- `protheus.png`: �cone da aplica��o.
- `quick-loading.gif` e `quick-loading.svg`: Imagens de loading exibidas durante a verifica��o do ambiente.
- `webagent_launcher.log`: Arquivo de log gerado automaticamente pela aplica��o (um por inst�ncia).

## Funcionamento

1. **Inicializa��o**: Ao iniciar, o launcher define um diret�rio de dados �nico para a inst�ncia e l� as configura��es do arquivo INI. Caso n�o exista, utiliza valores padr�o e cria o arquivo.
2. **Prioridade de Par�metros**: Se argumentos de linha de comando forem passados, eles t�m prioridade sobre o INI.
3. **Verifica��o do Web Agent**: Antes de abrir o Protheus, verifica se o Web Agent est� instalado e atualizado. Busca a vers�o/URL mais recente via web e instala automaticamente se necess�rio.
4. **Loader**: Exibe uma tela de carregamento enquanto realiza as verifica��es.
5. **Abertura do Protheus**: Carrega a URL configurada do Protheus, incluindo par�metros de programa e ambiente, se definidos.
6. **Logs**: Todas as a��es relevantes e erros s�o registrados em `webagent_launcher.log`.
7. **Tratamento de Erros**: Em caso de falha cr�tica, exibe uma tela de erro amig�vel ao usu�rio.

## Configura��o

O arquivo `protheus_launcher.ini` possui a seguinte estrutura:

```ini
[Protheus]
url=https://api.transjoi.com.br:10443/webapp/
programa=SIGAMDI
ambiente=producao
```

- **url**: Endere�o base do Protheus Web.
- **programa**: C�digo do programa a ser aberto (opcional).
- **ambiente**: Ambiente do Protheus (opcional).

> **Nota:** O caminho do instalador do Web Agent agora � obtido automaticamente via internet. O campo `msiPath` no INI � opcional e s� ser� usado se n�o houver URL remota.

## Como Executar

1. Instale as depend�ncias:
   ```
   npm install
   ```
2. Inicie a aplica��o:
   ```
   npm start
   ```
3. Par�metros opcionais:
   - `-p=PROGRAMA` para definir o programa.
   - `-e=AMBIENTE` para definir o ambiente.

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
- O launcher pode ser executado em m�ltiplas inst�ncias simultaneamente, cada uma com seu pr�prio ambiente isolado.
- Em caso de erro cr�tico, uma tela de erro ser� exibida ao usu�rio.
