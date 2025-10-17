/**
 * Sistema de logs con colores para mejor visualización
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Colores de texto
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Colores de fondo
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

const logger = {
    info: (mensaje) => {
        console.log(`${colors.blue}ℹ ${mensaje}${colors.reset}`);
    },
    
    success: (mensaje) => {
        console.log(`${colors.green}${mensaje}${colors.reset}`);
    },
    
    warning: (mensaje) => {
        console.log(`${colors.yellow}⚠️  ${mensaje}${colors.reset}`);
    },
    
    error: (mensaje) => {
        console.log(`${colors.red}${mensaje}${colors.reset}`);
    },
    
    step: (paso, mensaje) => {
        console.log(`\n${colors.cyan}${colors.bright}[${paso}] ${mensaje}${colors.reset}`);
    },
    
    debug: (mensaje) => {
        console.log(`${colors.dim}🔍 ${mensaje}${colors.reset}`);
    },
    
    data: (label, valor) => {
        console.log(`${colors.magenta}   ${label}:${colors.reset} ${valor}`);
    }
};

module.exports = { logger, colors };

