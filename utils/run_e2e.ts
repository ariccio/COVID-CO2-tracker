// import execSh from 'exec-sh'; 

// type procHandle = ReturnType<typeof execSh.promise> | null;
// const { spawn } = require('node:child_process');
import * as child_process from 'node:child_process';

import {exec, SubProcess, SubProcessOptions} from 'teen_process';


type procHandle = SubProcess | undefined;

const DEFAULT_RAILS_PORT = 3000;

const DEFAULT_FRONTEND_PORT = 3001;

let rails: procHandle;
let react: procHandle;



type startDetector = ((stdout: string, stderr: string) => boolean) | number | null

const railsStartDetector: startDetector = (stdout, stderr) => {
    if (/A server is already running/.test(stderr)) {
        checkPorts();
        throw new Error("Server already running.");
    }
    if (stderr.length > 0) {
        console.warn(`stdout for backend is > 0 (stderr: '${stderr}') assuming failure.`);
        // throw new Error(`stdout for backend is > 0, assuming failure.`);
    }
    if (/Listening on http/.test(stdout)) {
        return true;
    }
    if (/Use Ctrl-C to stop/.test(stdout)) {
        return true;
    }
    return false;
}

function checkPorts() {
    const spawnOpts: child_process.SpawnSyncOptions = {
        timeout: 1000,
        shell: true
    }
    try {
        const result3000 = child_process.spawnSync('lsof', [`-i :3000 -P`], spawnOpts);
        if (result3000.status === 0) {
            console.log(`current rails pid: ${rails?.pid}`);
            console.log(`current frontend pid: ${react?.pid}`);
            console.log(`processes on 3000:\r\n${result3000.output.toString()}`);
        }
        else {
            console.warn(`lsof failed: ${result3000.status}`);
            console.dir(result3000);
            console.log(`lsof output anyways: ${result3000.output}`);
        }

        const result3001 = child_process.spawnSync('lsof', [`-i :3001 -P`], spawnOpts);
        if (result3001.status === 0) {
            console.log(`current rails pid: ${rails?.pid}`);
            console.log(`current frontend pid: ${react?.pid}`);
            console.log(`process on 3001:\r\n${result3001.output.toString()}`);
        }
        else {
            console.warn(`lsof failed: ${result3001.status}`);
            console.dir(result3001);
            console.log(`lsof output anyways: ${result3001.output}`);
        }
    }
    catch (e) {
    }
}

const frontendStartDetector: startDetector = (stdout, stderr) => {
    if (stderr.length > 0) {
        console.warn(`stdout for frontend is > 0 (stderr: '${stderr}') assuming failure.`);
        // throw new Error(`stdout for frontend is > 0, assuming failure.`);
    }
    if (/Something is already running on port/.test(stdout)) {
        checkPorts();
        throw new Error(`Port issue!`);
    }
    if (/No issues found./.test(stdout)) {
        console.log(`frontend seems started: ${stdout}`);
        return true;
    }
    
    return false;
}


async function main() {
    console.log('|||||||||||||||||||||||||||')
    // rails = execSh.promise("rails s", undefined)
    let backendEnv = JSON.parse(JSON.stringify(process.env));
    backendEnv.PORT = '3000';
    const rails_opts: SubProcessOptions = {
        shell: true,
        env: backendEnv
    }
    rails = new SubProcess('rails s', undefined, rails_opts);

    const dump = (value: {stderr: string, stdout: string}) => {
        console.log('----------------------');
        console.log(value.stderr);
        console.log(value.stdout);
        console.log('----------------------');
    }
    let frontendEnv = JSON.parse(JSON.stringify(process.env));
    frontendEnv.PORT = '3001';

    const reactDir = process.cwd() + '/co2_client';
    frontendEnv.cwd = reactDir;
    console.log(reactDir)
    // react = execSh.promise("yarn start", modifiedEnv);
    // rails.then(dump)
    // react.then(dump);
    const react_opts: SubProcessOptions = {
        shell: true,
        env: frontendEnv,
        cwd: reactDir
    };

    react = new SubProcess('yarn start', undefined, react_opts);
    react.on('stream-line', line => {
        console.log(`frontend: ${line}`);
        // [STDOUT] foo
    });

    rails.on('stream-line', line => {
        console.log(`backend: ${line}`);
        // [STDOUT] foo
    });

    await rails.start(railsStartDetector);
    await react.start(frontendStartDetector);
      
}

async function politeCtrlC(proc: SubProcess) {
    process.stdout.write(`sending ctrl-c to ${proc.cmd}...`);
    await proc.stop('SIGINT', 1000);
    console.log(`process quit!`);
}

async function politeTerminate(proc: SubProcess) {
    if (!(proc.isRunning)) {
        return;
    }
    console.log(`sending terminate to ${proc.cmd}...`);
    // console.group(`${proc.cmd} termination output:`)
    await proc.stop('SIGTERM', 10_000);
    // console.groupEnd();
    console.log(`process quit!`);
}

async function killProc(proc: SubProcess) {
    if (!(proc.isRunning)) {
        console.log(`${proc.cmd} not running?`)
        return;
    }
    console.log(`\t\t >>> sending terminate to ${proc.cmd} <<<`);
    await proc.stop('SIGKILL', 1000);
}

async function ensureClosed(proc?: SubProcess) {
    if (proc === undefined) {
        return;
    }
    try {
        await politeCtrlC(proc);
    }

    catch(e) {
        if (e) {
            if ((e as any).message) {
                if (/Can't stop process; it's not currently running/.test((e as Error).message)) {
                    return;
                }
            }
        }

    }

    try {
        await politeTerminate(proc);
    }
    catch (e) {
        if (e) {
            if ((e as any).message) {
                if (/Can't stop process; it's not currently running/.test((e as Error).message)) {
                    return;
                }
            }
        }
        console.log(`proc ${proc?.cmd} did NOT politely stop with term.`);
        await killProc(proc);
        console.log(`${proc.cmd} killed?`);
        return;
    }

    // try {
    //     await politeCtrlC(proc);
    // }
    // catch (e) {
    //     console.log(`proc ${proc?.cmd} did NOT politely stop with ctrl-c.`);
    // }
    return;
}

function exceptionDump(e_: unknown) {
    if (!e_) {
        console.log("error, but error is undefined)");
    }
    else {
        const e: any = e_;
        if (e.message) {
            console.log(`error message: ${e.message}`);  // "Exited with code 10"
        }
        if (e.stdout) {
            console.log(`error stdout: ${e.stdout}`);   // "foo"
        }
        if (e.code) {
            console.log(`error code: ${e.code}`);     // 10
        }
        if (e.name) {
            console.log(`error name: ${e.name}`)
        }
        if (e.toString) {
            if (typeof e.toString === 'function') {
                console.log(`error string formatted: ${e.toString()}`);
            }
        }
        console.log('Any other exception info:');
        console.dir(e);
    }
}

main().then(
    () => {
        console.log(`DONE! Processes started.`);
        return ensureClosed(react).then(() => {
            return ensureClosed(rails);
        })
    },
    (e) => {
        console.log(`done with EXCEPTION (1)! Exiting...`);
        exceptionDump(e)
        return ensureClosed(react).then(() => {
            return ensureClosed(rails);
        })
    }
).catch((e) => {
    console.log(`done with EXCEPTION (2)! Exiting...`);
    exceptionDump(e);
    return ensureClosed(react).then(() => {
        return ensureClosed(rails);
    })
}).finally(() => {
    return ensureClosed(react).then(() => {
        return ensureClosed(rails);
    })
}).then(() => {
    console.log(`all done!`);
    process.exit(0);
})
