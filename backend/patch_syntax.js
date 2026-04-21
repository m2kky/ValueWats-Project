const fs = require('fs');

let code = fs.readFileSync('src/services/toolService.js', 'utf8');

code = code.replace(
  `        }
    }
}


    /**
     * HANDLER: Create Spreadsheet`,
  `        }
    }

    /**
     * HANDLER: Create Spreadsheet`
);

code = code.replace(
  `            return { success: false, error: error.message };
        }
    }

module.exports = new ToolService();`,
  `            return { success: false, error: error.message };
        }
    }
}

module.exports = new ToolService();`
);

fs.writeFileSync('src/services/toolService.js', code);
console.log('fixed syntax error in toolService.js');
