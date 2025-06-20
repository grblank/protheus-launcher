const { app, BrowserWindow, shell, dialog } = require('electron');
const fsPromises = require('fs').promises;
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const ini = require('ini');

// Usa o diretório seguro do usuário para arquivos de configuração e log
const userDataPath = app.getPath('userData');
const iniPath = path.join(userDataPath, 'protheus_launcher.ini');
const logPath = path.join(userDataPath, 'webagent_launcher.log');

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
    function logDebug(msg) {
        const line = `[${new Date().toISOString()}] DEBUG: ${msg}\n`;
        try { fs.appendFileSync(logPath, line, { flag: 'a', encoding: 'utf-8' }); } catch (err) { }
    }
    if (!fs.existsSync(iniPath)) {
        logDebug('Arquivo de configuração INI não encontrado, usando padrão.');
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: 'SIGAMDI',
            ambiente: 'producao'
        };
    }
    try {
        const config = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
        let resultConfig = {
            url: config.Protheus?.url || 'https://api.transjoi.com.br:10443/webapp/',
            programa: config.Protheus?.programa || '',
            ambiente: config.Protheus?.ambiente || ''
        };
        // Sobrescreve com argumentos da linha de comando, se existirem
        const cliArgs = getArgsFromCommandLine();
        if (cliArgs.programa) resultConfig.programa = cliArgs.programa;
        if (cliArgs.ambiente) resultConfig.ambiente = cliArgs.ambiente;
        return resultConfig;
    } catch (e) {
        logDebug('Erro ao ler arquivo de configuração INI: ' + e.message);
        return {
            url: 'https://api.transjoi.com.br:10443/webapp/',
            programa: 'SIGAMDI',
            ambiente: 'producao'
        };
    }
}

function writeConfig(config) {
    const iniContent = ini.stringify({ Protheus: config });
    fs.writeFileSync(iniPath, iniContent, 'utf-8');
}

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


async function checkAndInstallWebAgent() {
    // Apenas logs de erro serão gravados
    // Busca versão e url do webagent.json remoto
    let agentVersion = '1.0.17';
    let agentDownloadUrl = '';
    const logPath = path.join(__dirname, 'webagent_launcher.log');
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
        const webagentInfo = await new Promise((resolve, reject) => {
            https.get('https://quickops.transjoi.com.br/quick_public_files/webagent.json', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) { reject(e); }
                });
            }).on('error', reject);
        });
        if (webagentInfo.version) agentVersion = webagentInfo.version;
        if (webagentInfo.url) agentDownloadUrl = webagentInfo.url;
    } catch (e) {
        logError('Falha ao buscar webagent.json remoto: ' + e.message);
        // Se falhar, mantém valores padrão
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
        await fsPromises.access(agentDir);
        // Pasta existe, verifica o ini
        const iniContent = await fsPromises.readFile(agentIni, 'utf-8');
        if (!iniContent.includes(agentVersion)) {
            // Versão não encontrada, deleta pasta
            await fsPromises.rm(agentDir, { recursive: true, force: true });
            needsInstall = true;
        }
    } catch (e) {
        // Pasta não existe
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
            await new Promise((resolve, reject) => {
                const child = execFile(msiPath, args, (error) => {
                    if (error) {
                        logError('Erro ao executar instalação silenciosa: ' + error.message);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (e) {
            logError('Erro na instalação do Web Agent: ' + e.message);
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Erro na instalação do Web Agent',
                message: 'Não foi possível instalar o Web Agent automaticamente. Instale manualmente e tente novamente.'
            });
            app.quit();
            return false;
        }
        // Após a instalação, verifica se está correto
        try {
            await fsPromises.access(agentDir);
            const iniContent = await fsPromises.readFile(agentIni, 'utf-8');
            if (!iniContent.includes(agentVersion)) {
                throw new Error('Versão incorreta após instalação');
            }
        } catch (e) {
            logError('Web Agent não foi instalado corretamente: ' + e.message);
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Web Agent obrigatório',
                message: 'O Web Agent não foi instalado corretamente. O sistema será fechado.'
            });
            app.quit();
            return false;
        }
    }
    return true;
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
        console.error('Erro ao criar protheus_launcher.ini:', err);
    }
    // Garante a criação do arquivo de log
    try {
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, `[${new Date().toISOString()}] Log criado\n`, { flag: 'a', encoding: 'utf-8' });
        }
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] App iniciado\n`, { flag: 'a', encoding: 'utf-8' });
    } catch (err) {
        console.error('Erro ao criar webagent_launcher.log:', err);
    }
    const win = createWindow();
    const agentOk = await checkAndInstallWebAgent();
    if (!agentOk) {
        return;
    }
    // Limpa cookies, dados de sessão e service workers da URL
    const config = readConfig();
    const url = buildUrl(config);
    // Loga a URL final que será carregada
    try {
        const logPath = path.join(__dirname, 'webagent_launcher.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] DEBUG: URL carregada: ${url}\n`, { flag: 'a', encoding: 'utf-8' });
    } catch (e) { }
    const { session } = win.webContents;
    try {
        // Limpa cookies
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname;
        const cookies = await session.cookies.get({ domain });
        for (const cookie of cookies) {
            await session.cookies.remove(parsedUrl.origin, cookie.name);
        }
        // Limpa dados de sessão (localStorage, indexedDB, cache, etc)
        await session.clearStorageData({ origin: parsedUrl.origin });
        // Remove service workers
        await session.clearStorageData({ origin: parsedUrl.origin, storages: ['serviceworkers'] });
    } catch (e) {
        console.error('Erro ao limpar dados da sessão:', e);
    }
    // Tenta iniciar o web-agent.exe apenas se não estiver em execução
    try {
        const userProfile = process.env.USERPROFILE || process.env.HOME;
        const agentExe = path.join(userProfile, 'AppData', 'Local', 'Programs', 'web-agent', 'web-agent.exe');
        if (fs.existsSync(agentExe)) {
            // Verifica se já existe um processo web-agent.exe rodando
            const { execSync } = require('child_process');
            let isRunning = false;
            try {
                const stdout = execSync('tasklist /FI "IMAGENAME eq web-agent.exe" /NH', { encoding: 'utf8' });
                isRunning = stdout && stdout.toLowerCase().includes('web-agent.exe');
            } catch (e) {
                // Se der erro, assume que não está rodando
            }
            if (!isRunning) {
                execFile(agentExe, (error) => {
                    if (error) {
                        console.error('Erro ao iniciar web-agent.exe:', error);
                    }
                });
            }
        } else {
            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Web Agent não encontrado',
                message: 'O Web Agent não foi encontrado após a instalação. O sistema será fechado.'
            });
            app.quit();
            return;
        }
    } catch (e) {
        dialog.showMessageBoxSync({
            type: 'error',
            title: 'Erro ao iniciar Web Agent',
            message: 'Não foi possível iniciar o Web Agent. O sistema será fechado.'
        });
        app.quit();
        return;
    }
    // Após finalizar, carrega a página real
    win.loadURL(url);
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
