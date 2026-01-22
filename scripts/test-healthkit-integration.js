#!/usr/bin/env node
/**
 * HealthKit Integration Test Script
 * 
 * This script tests HealthKit functionality in a controlled environment.
 * Run this script to verify HealthKit integration before builds.
 * 
 * Usage:
 *   node scripts/test-healthkit-integration.js
 * 
 * Note: This script requires the app to be running in a simulator or device
 * with HealthKit available. It's designed to be run manually for verification.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'blue');
    console.log('='.repeat(60) + '\n');
}

function checkHealthKitModule() {
    logSection('Checking HealthKit Module');

    try {
        const healthKitPath = path.join(
            process.cwd(),
            'node_modules',
            '@kingstinct',
            'react-native-healthkit',
            'package.json'
        );

        if (!fs.existsSync(healthKitPath)) {
            log('❌ HealthKit module not found in node_modules', 'red');
            return false;
        }

        const packageJson = JSON.parse(fs.readFileSync(healthKitPath, 'utf8'));
        log(`✅ HealthKit module found: v${packageJson.version}`, 'green');

        // Check if version is 12.x
        const majorVersion = parseInt(packageJson.version.split('.')[0]);
        if (majorVersion < 12) {
            log(`⚠️  Warning: HealthKit version ${packageJson.version} may not support New Architecture`, 'yellow');
        } else {
            log(`✅ HealthKit version ${packageJson.version} should support New Architecture`, 'green');
        }

        return true;
    } catch (error) {
        log(`❌ Error checking HealthKit module: ${error.message}`, 'red');
        return false;
    }
}

function checkIOSConfiguration() {
    logSection('Checking iOS Configuration');

    const checks = [
        {
            name: 'Info.plist HealthKit usage descriptions',
            path: 'ios/NeuroBloom/Info.plist',
            check: (content) => {
                const hasShare = content.includes('NSHealthShareUsageDescription');
                const hasUpdate = content.includes('NSHealthUpdateUsageDescription');
                return hasShare && hasUpdate;
            },
        },
        {
            name: 'HealthKit entitlements',
            path: 'ios/NeuroBloom/NeuroBloom.entitlements',
            check: (content) => {
                return content.includes('com.apple.developer.healthkit');
            },
        },
        {
            name: 'app.config.js HealthKit config',
            path: 'app.config.js',
            check: (content) => {
                return content.includes('NSHealthShareUsageDescription') &&
                       content.includes('com.apple.developer.healthkit');
            },
        },
    ];

    let allPassed = true;
    for (const check of checks) {
        const filePath = path.join(process.cwd(), check.path);
        if (!fs.existsSync(filePath)) {
            log(`❌ ${check.name}: File not found at ${check.path}`, 'red');
            allPassed = false;
            continue;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (check.check(content)) {
                log(`✅ ${check.name}`, 'green');
            } else {
                log(`❌ ${check.name}: Configuration missing or incorrect`, 'red');
                allPassed = false;
            }
        } catch (error) {
            log(`❌ ${check.name}: Error reading file - ${error.message}`, 'red');
            allPassed = false;
        }
    }

    return allPassed;
}

function checkServiceImplementation() {
    logSection('Checking HealthKitService Implementation');

    const servicePath = path.join(process.cwd(), 'services', 'HealthKitService.js');
    if (!fs.existsSync(servicePath)) {
        log('❌ HealthKitService.js not found', 'red');
        return false;
    }

    const content = fs.readFileSync(servicePath, 'utf8');
    const checks = [
        {
            name: 'Uses v12+ requestAuthorization API ({ toRead: [...] })',
            pattern: /requestAuthorization\s*\(\s*\{\s*toRead:/,
            pass: true,
        },
        {
            name: 'Uses startDate/endDate in query methods (not from/to)',
            pattern: /startDate:\s*startDate/,
            pass: true,
        },
        {
            name: 'Has validation functions',
            pattern: /validateRequestAuthorizationParams|validateQueryOptions/,
            pass: true,
        },
        {
            name: 'Handles authorizationStatusFor correctly',
            pattern: /authorizationStatusFor/,
            pass: true,
        },
    ];

    let allPassed = true;
    for (const check of checks) {
        const matches = check.pattern.test(content);
        if (matches === check.pass) {
            log(`✅ ${check.name}`, 'green');
        } else {
            log(`❌ ${check.name}`, 'red');
            allPassed = false;
        }
    }

    return allPassed;
}

function checkTests() {
    logSection('Checking Test Coverage');

    const testPath = path.join(process.cwd(), '__tests__', 'services', 'HealthKitService.test.js');
    if (!fs.existsSync(testPath)) {
        log('⚠️  HealthKitService.test.js not found - tests should be created', 'yellow');
        return false;
    }

    log('✅ HealthKitService.test.js exists', 'green');

    // Try to run tests (if jest is available)
    try {
        log('\nRunning HealthKitService tests...', 'blue');
        execSync('npm test -- __tests__/services/HealthKitService.test.js --passWithNoTests', {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        log('\n✅ Tests passed', 'green');
        return true;
    } catch (error) {
        log('\n⚠️  Tests failed or jest not available - this is okay for manual verification', 'yellow');
        return false;
    }
}

function generateReport(results) {
    logSection('Integration Test Report');

    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r === true).length;
    const failed = total - passed;

    log(`Total Checks: ${total}`, 'blue');
    log(`Passed: ${passed}`, passed === total ? 'green' : 'yellow');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

    console.log('\n' + '-'.repeat(60));
    for (const [name, result] of Object.entries(results)) {
        const icon = result ? '✅' : '❌';
        const color = result ? 'green' : 'red';
        log(`${icon} ${name}`, color);
    }
    console.log('-'.repeat(60) + '\n');

    if (failed === 0) {
        log('🎉 All checks passed! HealthKit integration looks good.', 'green');
        return 0;
    } else {
        log('⚠️  Some checks failed. Please review the issues above.', 'yellow');
        return 1;
    }
}

// Main execution
function main() {
    log('\n🔍 HealthKit Integration Test Script', 'blue');
    log('This script verifies HealthKit configuration and implementation.\n', 'blue');

    const results = {
        'HealthKit Module': checkHealthKitModule(),
        'iOS Configuration': checkIOSConfiguration(),
        'Service Implementation': checkServiceImplementation(),
        'Test Coverage': checkTests(),
    };

    const exitCode = generateReport(results);
    process.exit(exitCode);
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = {
    checkHealthKitModule,
    checkIOSConfiguration,
    checkServiceImplementation,
    checkTests,
};
