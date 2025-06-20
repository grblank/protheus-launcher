const { app, BrowserWindow, shell, dialog } = require('electron');
const fsPromises = require('fs').promises;
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const instanceId = process.argv.find(arg => arg.startsWith('--instance=')) || `--instance=${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const customUserDataPath = path.join(app.getPath('appData'), 'protheus-launcher', instanceId.replace('--instance=', ''));
app.setPath('userData', customUserDataPath);

// Definir userDataPath único para cada instância
const userDataPath = app.getPath('userData');
const iniPath = path.join(userDataPath, 'protheus_launcher.ini');

// Função para ler argumentos da linha de comando
function getArgsFromCommandLine() {
    const args = process.argv.slice(1); // Ignora o executável
    const result = {};
    args.forEach(arg => {
        if (arg.startsWith('-p=')) {
            result.programa = arg.substring(3);
        } else if (arg.startsWith('-e=')) {
            result.ambiente = arg.substring(3);
        }
    });
    return result;
}

function readConfig() {
    const cliArgs = getArgsFromCommandLine();
    // Se algum parâmetro for passado via linha de comando, prioriza eles
    if (cliArgs.programa && !cliArgs.ambiente) {
        // Só programa informado
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: cliArgs.programa,
            ambiente: ''
        };
    } else if (!cliArgs.programa && cliArgs.ambiente) {
        // Só ambiente informado
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: '',
            ambiente: cliArgs.ambiente
        };
    } else if (cliArgs.programa && cliArgs.ambiente) {
        // Ambos informados
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: cliArgs.programa,
            ambiente: cliArgs.ambiente
        };
    }
    // Se nenhum parâmetro, usa o INI
    if (!fs.existsSync(iniPath)) {
        // Não grava log, apenas retorna padrão
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: 'SIGAMDI',
            ambiente: 'producao'
        };
    }
    try {
        const config = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
        return {
            url: config.Protheus?.url || 'https://api.transjoi.com.br:10443/webapp/',
            programa: config.Protheus?.programa || 'SIGAMDI',
            ambiente: config.Protheus?.ambiente || 'producao'
        };
    } catch (e) {
        // Exibe erro na tela
        showErrorScreen(BrowserWindow.getAllWindows()[0], 'Erro ao ler arquivo de configuração INI: ' + e.message);
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: 'SIGAMDI',
            ambiente: 'producao'
        };
    }
}

// Removida a função de escrita do INI e qualquer chamada a writeConfig

function buildUrl(config) {
    let url = config.url;
    const params = [];
    if (config.programa) params.push(`P=${encodeURIComponent(config.programa)}`);
    if (config.ambiente) params.push(`E=${encodeURIComponent(config.ambiente)}`);
    if (params.length) {
        url += (url.includes('?') ? '&' : '?') + params.join('&');
    }
    return url;
}

function promptConfig(config) {
    // Simple prompt using dialog (no UI)
    const result = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['OK', 'Cancelar'],
        defaultId: 0,
        title: 'Configuração do Protheus',
        message: 'Deseja alterar a configuração do launcher?',
        detail: `URL: ${config.url}\nPrograma (P): ${config.programa}\nAmbiente (E): ${config.ambiente}`
    });
    if (result === 0) {
        // User wants to edit config
        let newConfig = { ...config };
        if (dialog.showInputBox) {
            newConfig.url = dialog.showInputBox({
                title: 'URL do Protheus',
                value: config.url
            });
            newConfig.programa = dialog.showInputBox({
                title: 'Programa (P)',
                value: config.programa
            });
            newConfig.ambiente = dialog.showInputBox({
                title: 'Ambiente (E)',
                value: config.ambiente
            });
        }
        return newConfig;
    }
    return config;
}

function createWindow() {
    const config = readConfig();
    const url = buildUrl(config);
    const win = new BrowserWindow({
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'protheus.png'),
        webPreferences: {
            nodeIntegration: true, // necessário para injetar loader
            contextIsolation: false,
            sandbox: false, // Changed from true to false to allow file:// access
            enableRemoteModule: false,
            backgroundThrottling: false
        }
    });
    win.maximize();
    win.removeMenu && win.removeMenu();
    // Loader HTML - using external SVG from URL
    const loaderHtml = `
    <html><head><style>
    .quick-loading-overlay-content {
      background-color: #fff;
      border-radius: 3px;
      box-shadow: 0 1px 4px 0 rgba(0, 0, 0, .3);
      display: block;
      height: 80%;
      left: 50%;
      max-height: 104px;
      max-width: 200px;
      position: relative;
      top: 50%;
      -webkit-transform: translate(-50%, -50%);
      -ms-transform: translate(-50%, -50%);
      transform: translate(-50%, -50%);
      width: 100%;
      overflow-y: hidden;
    }
    .quick-overlay-fixed {
      background-color: rgba(5, 45, 62, .7);
      content: "";
      height: 100%;
      left: 0;
      top: 0;
      z-index: 1000;
      width: 100%;
      overflow-y: hidden;
      position: fixed;
    }
    .quick-loading-icon {
      display: block;
      text-align: center;
      margin-top: 16px;
    }
    .quick-loading-label {
      font-family: NunitoSans, sans-serif;
      font-size: 12px;
      line-height: 16px;
      color: #4a5c60;
      display: block;
      margin: 16px 16px 0 16px; /* Removido margin-bottom */
      text-align: center
    }
    </style></head><body>
    <div class="quick-overlay-fixed">
      <div class="quick-loading-overlay-content">
        <div class="quick-loading">
          <div class="quick-loading-icon"><img src="https://quickops.transjoi.com.br/img/quick-loading.svg" width="24" height="24" alt="Loading"></div>
          <div class="quick-loading-label">Verificando WebAgent...</div>
        </div>
      </div>
    </div>
    </body></html>
  `;
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loaderHtml));
    win.once('ready-to-show', () => {
        win.show();
    });
    win.webContents.on('did-fail-load', () => {
        win.show();
    });
    // ...
    // Bloqueia F5 e Ctrl+R
    win.webContents.on('before-input-event', (event, input) => {
        if (
            (input.key === 'F5' && !input.control && !input.alt && !input.shift) ||
            (input.key.toUpperCase() === 'R' && input.control)
        ) {
            event.preventDefault();
        }
    });
    return win;
}


function checkAndInstallWebAgent(win) {
    // Apenas logs de erro serão gravados
    // Busca versão e url do webagent.json remoto
    let agentVersion = '1.0.17';
    let agentDownloadUrl = '';
    function logError(msg) {
        const line = `[${new Date().toISOString()}] ERRO: ${msg}\n`;
        try {
            fs.appendFileSync(logPath, line, { flag: 'a' });
        } catch (err) {
            console.error('Erro ao gravar log de erro:', err);
        }
    }
    function logInfo(msg) {
        const line = `[${new Date().toISOString()}] INFO: ${msg}\n`;
        try {
            fs.appendFileSync(logPath, line, { flag: 'a', encoding: 'utf-8' });
        } catch (err) { }
    }
    try {
        const https = require('https');
        let webagentInfo = {};
        let fetchDone = false;
        let fetchError = null;
        https.get('https://quickops.transjoi.com.br/quick_public_files/webagent.json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    webagentInfo = JSON.parse(data);
                } catch (e) { fetchError = e; }
                fetchDone = true;
            });
        }).on('error', (err) => {
            fetchError = err;
            fetchDone = true;
        });
        const start = Date.now();
        while (!fetchDone && Date.now() - start < 5000) {
            require('deasync').runLoopOnce();
        }
        if (fetchError) {
            showErrorScreen(win, 'Falha ao buscar webagent.json remoto: ' + fetchError.message);
            return false;
        }
        if (webagentInfo.version) agentVersion = webagentInfo.version;
        if (webagentInfo.url) agentDownloadUrl = webagentInfo.url;
    } catch (e) {
        showErrorScreen(win, 'Falha ao buscar webagent.json remoto: ' + e.message);
        return false;
    }
    const config = readConfig();
    // Se o JSON remoto trouxe uma URL, usa ela
    const msiPath = agentDownloadUrl || config.msiPath;
    const userProfile = process.env.USERPROFILE || process.env.HOME;
    const agentDir = path.join(userProfile, 'AppData', 'Local', 'Programs', 'web-agent');
    const agentIni = path.join(agentDir, 'web-agent.ini');
    // ...
    let needsInstall = false;
    try {
        if (fs.existsSync(agentDir)) {
            // Pasta existe, verifica o ini
            if (fs.existsSync(agentIni)) {
                const iniContent = fs.readFileSync(agentIni, 'utf-8');
                if (!iniContent.includes(agentVersion)) {
                    // Versão não encontrada, deleta pasta
                    fs.rmSync(agentDir, { recursive: true, force: true });
                    needsInstall = true;
                }
            } else {
                needsInstall = true;
            }
        } else {
            needsInstall = true;
        }
    } catch (e) {
        needsInstall = true;
    }
    if (needsInstall) {
        // Tenta instalação silenciosa (EXE: /S ou /silent, MSI: /quiet)
        let args = [];
        if (msiPath.endsWith('.msi')) {
            args = ['/quiet'];
        } else {
            args = ['/S', '/quiet', '/silent'];
        }
        try {
            require('child_process').execFileSync(msiPath, args);
        } catch (e) {
            showErrorScreen(win, 'Erro ao executar instalador do Web Agent: ' + e.message + '\nCaminho: ' + msiPath);
            return false;
        }
        // Após a instalação, verifica se está correto
        try {
            if (fs.existsSync(agentDir) && fs.existsSync(agentIni)) {
                const iniContent = fs.readFileSync(agentIni, 'utf-8');
                if (!iniContent.includes(agentVersion)) {
                    showErrorScreen(win, 'Web Agent instalado, mas versão incorreta encontrada no INI. Esperado: ' + agentVersion);
                    return false;
                }
            } else {
                showErrorScreen(win, 'Diretório ou INI do Web Agent não encontrado após instalação.');
                return false;
            }
        } catch (e) {
            showErrorScreen(win, 'Web Agent não foi instalado corretamente: ' + e.message);
            return false;
        }
    }
    return true;
}

function showErrorScreen(win, message) {
    const errorHtml = `
    <html><head><style>
    .quick-loading-overlay-content {
      background-color: #fff;
      border-radius: 3px;
      box-shadow: 0 1px 4px 0 rgba(0, 0, 0, .3);
      display: block;
      height: 80%;
      left: 50%;
      max-height: 104px;
      max-width: 300px;
      position: relative;
      top: 50%;
      -webkit-transform: translate(-50%, -50%);
      -ms-transform: translate(-50%, -50%);
      transform: translate(-50%, -50%);
      width: 100%;
      overflow-y: hidden;
    }
    .quick-overlay-fixed {
      background-color: rgba(180, 0, 0, .7);
      content: "";
      height: 100%;
      left: 0;
      top: 0;
      z-index: 1000;
      width: 100%;
      overflow-y: hidden;
      position: fixed;
    }
    .quick-loading-icon {
      display: block;
      text-align: center;
      margin-top: 16px;
    }
    .quick-loading-label {
      font-family: NunitoSans, sans-serif;
      font-size: 14px;
      line-height: 18px;
      color: #a00;
      display: block;
      margin: 16px 16px 0 16px;
      text-align: center
    }
    </style></head><body>
    <div class="quick-overlay-fixed">
      <div class="quick-loading-overlay-content">
        <div class="quick-loading">
          <div class="quick-loading-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1"/></svg>
          </div>
          <div class="quick-loading-label">${message}</div>
        </div>
      </div>
    </div>
    </body></html>
    `;
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
    win.show();
}

app.whenReady().then(async () => {
    // Garante a criação do INI ao iniciar o app
    try {
        if (!fs.existsSync(iniPath)) {
            const defaultConfig = `
[Protheus]
url=https://api.transjoi.com.br:10443/webapp/
programa=SIGAMDI
ambiente=producao
`;
            fs.writeFileSync(iniPath, defaultConfig.trim());
        }
    } catch (err) {
        showErrorScreen(BrowserWindow.getAllWindows()[0], 'Erro ao criar protheus_launcher.ini: ' + err.message);
        return;
    }
    const win = createWindow();
    // Passo 2: Só valida/instala o Web Agent se ele não estiver rodando
    let agentOk = true;
    let agentAlreadyRunning = false;
    try {
        const userProfile = process.env.USERPROFILE || process.env.HOME;
        const agentExe = path.join(userProfile, 'AppData', 'Local', 'Programs', 'web-agent', 'web-agent.exe');
        if (fs.existsSync(agentExe)) {
            const { execSync } = require('child_process');
            let isRunning = false;
            try {
                const stdout = execSync('tasklist /FI "IMAGENAME eq web-agent.exe" /NH', { encoding: 'utf8' });
                isRunning = stdout && stdout.toLowerCase().includes('web-agent.exe');
            } catch (e) {
                // Se der erro, assume que não está rodando
            }
            if (!isRunning) {
                agentOk = await checkAndInstallWebAgent(win);
                if (!agentOk) return;
                // Inicia o Web Agent
                execFile(agentExe, (error) => {
                    if (error) {
                        showErrorScreen(win, 'Erro ao iniciar web-agent.exe: ' + error.message);
                    }
                });
            } else {
                agentAlreadyRunning = true;
            }
        } else {
            agentOk = await checkAndInstallWebAgent(win);
            if (!agentOk) return;
        }
    } catch (e) {
        showErrorScreen(win, 'Não foi possível iniciar o Web Agent. O sistema será fechado.');
        app.quit();
        return;
    }
    // Passo 3: Só mostra loading enquanto realmente está carregando
    if (agentAlreadyRunning) {
        // Se já está rodando, carrega direto a página real
        const config = readConfig();
        const url = buildUrl(config);
        win.once('ready-to-show', () => {
            win.show();
        });
        win.loadURL(url);
    } else {
        // Limpa cookies, dados de sessão e service workers da URL
        const config = readConfig();
        const url = buildUrl(config);
        // Loga a URL final que será carregada
        try {
            const logPath = path.join(userDataPath, 'webagent_launcher.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] DEBUG: URL carregada: ${url}\n`, { flag: 'a', encoding: 'utf-8' });
        } catch (e) { }
        const { session } = win.webContents;
        try {
            // Limpa cookies
            const parsedUrl = new URL(url);
            const domain = parsedUrl.hostname;
            //const cookies = await session.cookies.get({ domain });
            //for (const cookie of cookies) {
            //    await session.cookies.remove(parsedUrl.origin, cookie.name);
            //}
            // Limpa dados de sessão (localStorage, indexedDB, cache, etc)
            //await session.clearStorageData({ origin: parsedUrl.origin });
            // Remove service workers
            //await session.clearStorageData({ origin: parsedUrl.origin, storages: ['serviceworkers'] });
        } catch (e) {
            console.error('Erro ao limpar dados da sessão:', e);
        }
        win.loadURL(url);
    }
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    try {
        fs.rmSync(customUserDataPath, { recursive: true, force: true });
    } catch (e) { /* ignora erro */ }
    if (process.platform !== 'darwin') app.quit();
});
