import {execSync} from 'child_process';
import {createInterface} from 'readline';

function run(cmd) {
    return execSync(cmd, {encoding: 'utf8'}).trim();
}

function ask(query) {
    const rl = createInterface({input: process.stdin, output: process.stdout});
    return new Promise(resolve => {
        rl.question(query, answer => {
            rl.close();
            resolve(answer.toLowerCase());
        });
    });
}

async function main() {
    const mergedOutput = run('git branch --merged');
    const branches = mergedOutput
        .split('\n')
        .map(b => b.trim())
        .filter(b => b && !b.startsWith('*'))
        .filter(b => b !== 'main' && b !== 'master' && !/^develop-\d/.test(b));

    if (branches.length === 0) {
        console.log('No merged branches to delete.');
        return;
    }

    console.log('Merged branches:\n');
    branches.forEach(b => console.log(`  ${b}`));
    console.log();

    const answer = await ask('Delete all these branches? (y/N) ');

    if (answer !== 'y' && answer !== 'yes') {
        console.log('Aborted.');
        return;
    }

    for (const branch of branches) {
        try {
            run(`git branch -d "${branch}"`);
            console.log(`  ✓ Deleted ${branch}`);
        } catch (e) {
            console.error(`  ✗ Failed to delete ${branch}: ${e.message}`);
        }
    }

    console.log('\nDone.');
}

main();
