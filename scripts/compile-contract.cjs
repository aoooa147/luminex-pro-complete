// Simple Solidity compiler script (CommonJS)
// Compiles contract with OpenZeppelin imports support
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { join, dirname } = require('path');
const solc = require('solc');

const projectRoot = join(__dirname, '..');
const nodeModulesPath = join(projectRoot, 'node_modules');

// Cache for resolved files to avoid reading multiple times
const fileCache = new Map();

// Function to find import files (recursive)
function findImports(importPath) {
  // Check cache first
  if (fileCache.has(importPath)) {
    return fileCache.get(importPath);
  }
  
  let result = { error: 'File not found' };
  
  // Handle OpenZeppelin imports
  if (importPath.startsWith('@openzeppelin/')) {
    const fullPath = join(nodeModulesPath, importPath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      result = { contents: content };
      fileCache.set(importPath, result);
      return result;
    }
  }
  
  // Try relative path from contracts directory
  const relativePath = join(projectRoot, 'contracts', importPath);
  if (existsSync(relativePath)) {
    const content = readFileSync(relativePath, 'utf8');
    result = { contents: content };
    fileCache.set(importPath, result);
    return result;
  }
  
  // Try relative path from node_modules
  const nodeModulesRelativePath = join(nodeModulesPath, importPath);
  if (existsSync(nodeModulesRelativePath)) {
    const content = readFileSync(nodeModulesRelativePath, 'utf8');
    result = { contents: content };
    fileCache.set(importPath, result);
    return result;
  }
  
  fileCache.set(importPath, result);
  return result;
}

// Load all OpenZeppelin contracts recursively
function loadAllSources(dir, sources = {}) {
  const { readdirSync, statSync } = require('fs');
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        loadAllSources(fullPath, sources);
      } else if (entry.isFile() && entry.name.endsWith('.sol')) {
        const relativePath = fullPath.replace(nodeModulesPath + '/', '');
        sources[relativePath] = {
          content: readFileSync(fullPath, 'utf8')
        };
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  return sources;
}

const contractPath = join(projectRoot, 'contracts', 'LuxStakingV2Simple.sol');
const contractSource = readFileSync(contractPath, 'utf8');

// Prepare input for solc with all OpenZeppelin sources
const openZeppelinPath = join(nodeModulesPath, '@openzeppelin', 'contracts');
const allSources = {
  'LuxStakingV2Simple.sol': {
    content: contractSource,
  },
  ...loadAllSources(openZeppelinPath)
};

const input = {
  language: 'Solidity',
  sources: allSources,
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

console.log('Compiling contract...');
console.log('Loading OpenZeppelin contracts...');
console.log(`Found ${Object.keys(allSources).length} source files`);

// Compile
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

// Check for errors
if (output.errors) {
  const errors = output.errors.filter(e => e.severity === 'error');
  const warnings = output.errors.filter(e => e.severity === 'warning');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.slice(0, 5).forEach(warning => {
      console.log(`   ${warning.message}`);
    });
    if (warnings.length > 5) {
      console.log(`   ... and ${warnings.length - 5} more warnings`);
    }
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Compilation errors:');
    errors.forEach(error => {
      console.error(`   ${error.message}`);
      if (error.formattedMessage) {
        console.error(`   ${error.formattedMessage.split('\n').slice(0, 3).join('\n')}`);
      }
    });
    process.exit(1);
  }
}

// Get compiled contract
const contract = output.contracts['LuxStakingV2Simple.sol']?.['LuxStakingV2Simple'];

if (!contract) {
  console.error('❌ Contract not found in output');
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    errors.forEach(error => {
      console.error(`   ${error.message}`);
    });
  }
  process.exit(1);
}

// Create artifacts directory
const artifactsDir = join(projectRoot, 'artifacts', 'contracts', 'LuxStakingV2Simple.sol');
mkdirSync(artifactsDir, { recursive: true });

// Save ABI and bytecode
const artifact = {
  contractName: 'LuxStakingV2Simple',
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
  deployedBytecode: contract.evm.deployedBytecode ? contract.evm.deployedBytecode.object : undefined,
};

writeFileSync(
  join(artifactsDir, 'LuxStakingV2Simple.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('\n✅ Contract compiled successfully!');
console.log(`   📁 ABI saved to: artifacts/contracts/LuxStakingV2Simple.sol/LuxStakingV2Simple.json`);
console.log(`   💾 Bytecode size: ${(contract.evm.bytecode.object.length / 2).toLocaleString()} bytes`);
console.log(`   📊 Functions: ${contract.abi.filter(item => item.type === 'function').length}`);
console.log(`   📊 Events: ${contract.abi.filter(item => item.type === 'event').length}`);
