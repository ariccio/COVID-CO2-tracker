// import execSh from 'exec-sh'; 

// type procHandle = ReturnType<typeof execSh.promise> | null;
// const { spawn } = require('node:child_process');
import * as child_process from 'node:child_process';

import {exec, SubProcess, SubProcessOptions} from 'teen_process';

console.log(`run_e2e.ts`);

type procHandle = SubProcess | undefined;
type procPid =  number | undefined;
const DEFAULT_RAILS_PORT = '3000';

const DEFAULT_FRONTEND_PORT = '3001';

let cypress_rails: procHandle;
let cypress_rails_pid: procPid;

// let cypress: procHandle;
let webpack: procHandle;
let webpack_pid: procPid;


type startDetector = ((stdout: string, stderr: string) => boolean) | number | null

// const railsStartDetector: startDetector = (stdout, stderr) => {
//     if (/A server is already running/.test(stderr)) {
//         checkPorts();
//         throw new Error("Server already running.");
//     }
//     // if (stderr.length > 0) {
//     //     // console.warn(`stdout for backend is > 0 (stderr: '${stderr}') assuming failure.`);
//     //     // throw new Error(`stdout for backend is > 0, assuming failure.`);
//     // }
//     if (/Listening on http/.test(stdout)) {
//         return true;
//     }
//     if (/Use Ctrl-C to stop/.test(stdout)) {
//         return true;
//     }
//     return false;
// }

function checkPortClear(port: string): boolean {
    const spawnOpts: child_process.SpawnSyncOptions = {
        timeout: 1000,
        shell: true
    }
    try {
        const lsofResult = child_process.spawnSync('lsof', [`-i :${port} -P -V`], spawnOpts);
        if (lsofResult.status === 0) {
            console.log(`processes on '${port}' (checkPortClear):\r\n${lsofResult.output.toString()}`);
            console.log(`length of output (checkPortClear): ${lsofResult.output.length}`);
            return false;
        }
        else if (lsofResult.status === 1) {
            // https://github.com/lsof-org/lsof/blob/ceb40c37f98a9c66bd5dd6115d0f22606f993f06/src/main.c#L1658C39-L1658C68
            // Internet address not located:
            if (/Internet address not located/.test(lsofResult.output.toString())) {
                console.log(`port ${port} is clear!`);
                return true;
            }
            console.log(`lsof reported somethign ELSE for port ${port} (checkPortClear): ${lsofResult.output.toString()}!`);
            return false;
        }
        console.warn(`lsof failed (checkPortClear): ${lsofResult.status}`);
        console.dir(lsofResult);
        console.log(`lsof output anyways (checkPortClear): ${lsofResult.output.toString()}`);
        return false;
    }
    catch (e) {
        console.log(`spawning/calling/reading lsof failed and threw an exception! (checkPortClear) ${e}`);
        throw e;
    }
}

function checkPortInUse(port: string): boolean {
    const spawnOpts: child_process.SpawnSyncOptions = {
        timeout: 1000,
        shell: true
    }
    try {
        const lsofResult = child_process.spawnSync('lsof', [`-i :${port} -P -V`], spawnOpts);
        if (lsofResult.status === 0) {
            console.log(`processes on '${port}' (checkPortInUse):\r\n${lsofResult.output.toString()}`);
            console.log(`length of output (checkPortInUse): ${lsofResult.output.length}`);
            return true;
        }
        else if (lsofResult.status === 1) {
            // https://github.com/lsof-org/lsof/blob/ceb40c37f98a9c66bd5dd6115d0f22606f993f06/src/main.c#L1658C39-L1658C68
            // Internet address not located:
            if (/Internet address not located/.test(lsofResult.output.toString())) {
                console.log(`port ${port} is clear!`);
                return false;
            }
            console.log(`lsof reported somethign ELSE for port ${port} (checkPortInUse): ${lsofResult.output.toString()}!`);
            return false;
        }
        console.warn(`lsof failed (checkPortInUse): ${lsofResult.status}`);
        console.dir(lsofResult);
        console.log(`lsof output anyways (checkPortInUse): ${lsofResult.output.toString()}`);
        return false;
    }
    catch (e) {
        console.log(`spawning/calling/reading lsof failed and threw an exception! (checkPortInUse) ${e}`);
        throw e;

    }
}


function checkPorts() {
    const spawnOpts: child_process.SpawnSyncOptions = {
        timeout: 1000,
        shell: true
    }
    try {
        const result3000 = child_process.spawnSync('lsof', [`-i :${DEFAULT_RAILS_PORT} -P`], spawnOpts);
        if (result3000.status === 0) {
            // console.log(`current rails pid: ${rails?.pid}`);
            console.log(`current frontend pid (checkPorts): ${cypress_rails?.pid}`);
            console.log(`processes on ${DEFAULT_RAILS_PORT}: (checkPorts)\r\n${result3000.output.toString()}`);
        }
        else {
            console.warn(`lsof failed (checkPorts): ${result3000.status}`);
            console.dir(result3000);
            console.log(`lsof output anyways (checkPorts): ${result3000.output.toString()}`);
        }

        const result3001 = child_process.spawnSync('lsof', [`-i :${DEFAULT_FRONTEND_PORT} -P`], spawnOpts);
        if (result3001.status === 0) {
            // console.log(`current rails pid: ${rails?.pid}`);
            console.log(`current frontend pid (checkPorts): ${cypress_rails?.pid}`);
            console.log(`process on ${DEFAULT_FRONTEND_PORT} (checkPorts):\r\n${result3001.output.toString()}`);
        }
        else {
            console.warn(`lsof failed (checkPorts): ${result3001.status}`);
            console.dir(result3001);
            console.log(`lsof output anyways (checkPorts): ${result3001.output}`);
        }
    }
    catch (e) {
        console.log(`spawning/calling/reading lsof failed and threw an exception! (checkPorts) ${e}`);
        throw e;
    }
}

const cypressRailsStartDetector: startDetector = (stdout, stderr) => {
    if ((cypress_rails_pid === undefined) && (cypress_rails !== undefined) && (cypress_rails.pid !== undefined) && (cypress_rails.pid !== null)) {
        console.log(`cypress_rails pid: ${cypress_rails.pid}`);
        console.log(`Setting cypress_rails_pid global: ${cypress_rails.pid}`);
        cypress_rails_pid = cypress_rails.pid;
    }
    // if (stderr.length > 0) {
    //     // console.warn(`stdout for frontend is > 0 (stderr: '${stderr}') assuming failure.`);
    //     // throw new Error(`stdout for frontend is > 0, assuming failure.`);
    // }
    if (/Something is already running on port/.test(stdout)) {
        checkPorts();
        throw new Error(`Port issue!`);
    }
    if (/A server is already running/.test(stderr)) {
        checkPorts();
        throw new Error("Server already running.");
    }
    if (/Cypress failed/.test(stdout)) {
        throw new Error("Some cypress issue.");
    }
    if (/ERROR in/.test(stdout)) {
        console.log("(stdout) Possible compilation error!");
        throw new Error("(stdout) some kind of error - maybe compilation?");
    }
    if (/ERROR in/.test(stderr)) {
        console.log("(stderr) Possible compilation error!");
        throw new Error("(stderr) some kind of error - maybe compilation?");
    }
    if (/(Run Starting)/.test(stdout)) {
        console.log(`\u001b[1m\u001b[32mfrontend seems to have started: ${stdout}\u001b[0m`);
        return true;
    }    
    return false;
}

const webpackStartDetector: startDetector = (stdout, stderr) => {

    if ((webpack_pid === undefined) && (webpack !== undefined) && (webpack.pid !== undefined) && (webpack.pid !== null)) {
        console.log(`webpack pid: ${webpack.pid}`);
        console.log(`Setting webpack_pid global: ${webpack.pid}`);
        webpack_pid = webpack.pid;
    }
    if (/ERROR in/.test(stdout)) {
        console.log("(stdout) Possible compilation error!");
        throw new Error("(stdout) some kind of error - maybe compilation?");
    }
    if (/ERROR in/.test(stderr)) {
        console.log("(stderr) Possible compilation error!");
        throw new Error("(stderr) some kind of error - maybe compilation?");
    }
    if (/No issues found./.test(stdout)) {
        console.log(`Webpack seems ready: ${stdout}`);
        return true;
    }
    if (/Something is already running/.test(stdout)) {
        checkPorts();
        throw new Error("Server already running.");
    }
    return false;


}

function tryAndExitAll() {
    return ensureClosed(cypress_rails).then(() => {
        return ensureClosed(webpack);            
    }).then(() => {
        console.log("all closed in response to SIGINT");
    })
}

function setupSelfHooks(): void {
    process.on('SIGINT', tryAndExitAll);
}


function setupFollowerHooks(proc: procHandle, name: string): void {
    if (proc === undefined) {
        console.log(`Proc ${name} is undefined!`);
        return;
    }
    proc.on('stream-line', line => {
        console.log(`${name}: ${line}`);
        // [STDOUT] foo
    });

    proc.on("exit", (code, signal) => {
        console.log(`${name} exit: ${code}, ${signal}`)
    });
    proc.on("stop", (code, signal) => {
        console.log(`${name} stop: ${code}, ${signal}`)
    });
    proc.on("end", (code, signal) => {
        console.log(`${name} end: ${code}, ${signal}`)
    });
    proc.on("die", (code, signal) => {
        console.log(`${name} die: ${code}, ${signal}`)
    });

}


function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

async function main() {
    console.log('\n\n\n\n');

    const is3000Clear = checkPortClear(DEFAULT_RAILS_PORT);
    if (!is3000Clear) {
        console.log(`port ${DEFAULT_RAILS_PORT} is not clear! Exiting.`);
        return 1;
    }
    const is3001Clear = checkPortClear(DEFAULT_FRONTEND_PORT);
    if (!is3001Clear) {
        console.log(`port ${DEFAULT_FRONTEND_PORT} is not clear! Exiting.`);
        return 1;
    }


    setupSelfHooks();

    // rails = execSh.promise("rails s", undefined)
    let backendEnv = JSON.parse(JSON.stringify(process.env));
    backendEnv.PORT = DEFAULT_RAILS_PORT;
    // backendEnv.RAILS_MAX_THREADS = 7;
    // backendEnv.ENV = 'test';
    backendEnv.IsEndToEndBackendServerSoSTFUWithTheLogs = 'yes';
    backendEnv.CYPRESS_RAILS_CYPRESS_DIR = './co2_client';
    backendEnv.CYPRESS_RAILS_PORT = DEFAULT_RAILS_PORT;
    backendEnv.CYRESS_RAILS_HOST = 'localhost';
    // backendEnv.CYPRESS_RAILS_OVERRIDE_FULL_BASE_PATH = 'http://localhost:3001/';
    // backendEnv.CYPRESS_RAILS_BASE_PATH = 
    const rails_opts: SubProcessOptions = {
        shell: true,
        env: backendEnv
    }

    // rake --trace=stdout --verbose --backtrace=stdout cypress:run 
    cypress_rails = new SubProcess('rake cypress:run', undefined, rails_opts);
    setupFollowerHooks(cypress_rails, "cypress_rails");
    
    const dump = (value: {stderr: string, stdout: string}) => {
        console.log('----------------------');
        console.log(value.stderr);
        console.log(value.stdout);
        console.log('----------------------');
    }
    // let frontendEnv = JSON.parse(JSON.stringify(process.env));
    // frontendEnv.PORT = '3002';

    const frontendDir = process.cwd() + '/co2_client';
    // frontendEnv.cwd = frontendDir;
    // console.log(frontendDir)
    // react = execSh.promise("yarn start", modifiedEnv);
    // rails.then(dump)
    // react.then(dump);

    // const frontend_opts: SubProcessOptions = {
    //     shell: true,
    //     env: frontendEnv,
    //     cwd: frontendDir
    // };

    let webpackEnv = JSON.parse(JSON.stringify(process.env));
    webpackEnv.PORT = DEFAULT_FRONTEND_PORT;
    webpackEnv.BROWSER = 'none';

    const webpack_opts: SubProcessOptions = {
        shell: true,
        env: webpackEnv,
        cwd: frontendDir
    };

    webpack = new SubProcess('yarn start', undefined, webpack_opts);
    setupFollowerHooks(webpack, "webpack");

    // cypress = new SubProcess('yarn cypress run', undefined, frontend_opts);
    // setupFollowerHooks(cypress, "cypress");


    console.warn("TODO: .start can reject! See utils/node_modules/teen_process/lib/subprocess.js:200");
    //see also: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
    // and: https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/unix/process.c#L956
    await webpack.start(webpackStartDetector);
    const webPackPortInUse = checkPortInUse(DEFAULT_FRONTEND_PORT);
    if (webPackPortInUse) {
        console.log("Ok, webpack's port seems to be in use...");
    }
    else {
        console.log("Webpack's port is not in use? Exiting...");
        return 1;
    }
    console.warn("TODO: .start can reject! See utils/node_modules/teen_process/lib/subprocess.js:200");
    // see also: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
    // and: https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/unix/process.c#L956
    await cypress_rails.start(cypressRailsStartDetector);
    // await cypress.start(frontendStartDetector, 60_000);
    console.log(`cypress running...`);
    
    const cypressRailsPortInUse = checkPortInUse(DEFAULT_RAILS_PORT);
    if (cypressRailsPortInUse) {
        console.log("Ok, cypress_rails's port seems to be in use...");
    }
    else {
        console.log("Cypress_rails's port is not in use? Exiting...");
        return 1;
    }
    // console.log("SLEEPING FOR 60 SECONDS");
    // await(sleep(60_000));
    // console.log("SLEEPING DONE");
    // rails.
    
    // const webpack_out = webpack?.proc?.stdout?.read();
    // const webpack_warns = webpack_out?.match(/Warn/i);
    // console.log(`warnings from webpack: ${webpack_warns}`);
    // for (let i = 0; i < (webpack_warns?.length || 0); ++i) {
    //     console.log(`webpack warn #${i}, ${webpack_warns?.at(i) }`);
    // }
    // // const cypress_warns = cypress_out?.match(/Warn/))

    // const rails_out = rails?.proc?.stdout?.read();
    // const rails_warns = rails_out?.match(/Warn/i);
    // console.log(`warnings from rails: ${rails_warns}`);
    // for (let i = 0; i < (rails_warns?.length || 0); ++i) {
    //     console.log(`rails warn #${i}, ${rails_warns?.at(i)}`);
    // }

    return cypress_rails.join();

}

async function politeCtrlC(proc: SubProcess) {
    if (!(proc.isRunning)) {
        return;
    }
    console.log(`sending ctrl-c to ${proc.cmd}...`);
    await proc.stop('SIGINT', 100);
    console.log(`process quit!`);
}

async function politeTerminate(proc: SubProcess) {
    // if (!(proc.isRunning)) {
    //     return;
    // }
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
        console.warn("proc is undefined! Probably already closed.");
        return;
    }
    // if (!(proc.isRunning)) {
    //     // console.log(`${proc.cmd} already stopped.`);
    //     return;
    // }
    // try {
    //     await politeCtrlC(proc);
    // }
    // catch(e) {
    //     console.log(`Caught: ${String(e)}`);
    //     if (e) {
    //         if ((e as any).message) {
    //             if (/Can't stop process; it's not currently running/.test((e as Error).message)) {
    //                 return;
    //             }
    //         }
    //     }
    // }

    try {
        console.log("Ok, now trying to politely terminate too...");
        await politeTerminate(proc);
    }
    catch (e) {
        console.log(`Caught: ${String(e)}`);
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

function forceClose(pid: number | undefined) {
    if (pid === undefined) {
        console.log(`pid is undefined! Nothing to close.`);
        return;
    }
    // https://nodejs.org/api/process.html#processkillpid-signal:~:text=in%20Worker%20threads.-,process.kill(pid%5B%2C%20signal%5D),-%23
    console.log(`force closing pid ${pid}`);
    const err = process.kill(pid);


    // internally, calls one of two things:
    // 1: 
    // https://github.com/nodejs/node/blob/4df34cf6dd497c4b7487c98fa5581c85b05063dc/src/process_wrap.cc#L300
    // which calls, uv_process_kill, which is just uv_kill: https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/unix/process.c#L1086
    //
    // or, 2:
    // https://github.com/nodejs/node/blob/4df34cf6dd497c4b7487c98fa5581c85b05063dc/src/node_process_methods.cc#L146
    // which calls uv_kill: https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/unix/process.c#L1092
    // which calls kill.
    /*
        https://www.gnu.org/software/libc/manual/html_node/Signaling-Another-Process.html
        The return value from kill is zero if the signal can be sent successfully. Otherwise, no signal is sent, and a value of -1 is returned. If pid specifies sending a signal to several processes, kill succeeds if it can send the signal to at least one of them. There’s no way you can tell which of the processes got the signal or whether all of them did.

        The following errno error conditions are defined for this function:

        EINVAL
        The signum argument is an invalid or unsupported number.

        EPERM
        You do not have the privilege to send a signal to the process or any of the processes in the process group named by pid.

        ESRCH
        The pid argument does not refer to an existing process or group.
    */
    // UV__ERR is https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/uv-common.h#L47

    // On windows it's ugly (and they don't check all return values!)
    // https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/win/process.c#L1374
    // Internally it calls uv__kill, which is hella cursed: https://github.com/libuv/libuv/blob/17219b8f39f7cd33472c94214010b603322bd0fa/src/win/process.c#L1158
}

main().then(
    (result) => {
        console.log(`DONE! ${result}`);
        return ensureClosed(cypress_rails).then(() => {
            return ensureClosed(webpack);            
        }).then(() => {
            return result;
        })
    },
    (e) => {
        console.log(`done with EXCEPTION (1)! Exiting...`);
        exceptionDump(e)
        return ensureClosed(cypress_rails).then(() => {
            return ensureClosed(webpack);
        }).then(() => process.exit(1));
    }
).catch((e) => {
    console.log(`done with EXCEPTION (2)! Exiting...`);
    exceptionDump(e);
    return ensureClosed(cypress_rails).then(() => {
        return ensureClosed(webpack);
    }).then(() => process.exit(2));
}).finally(() => {
    console.log(`finally (1)`);
    return ensureClosed(cypress_rails).then(() => {
        return ensureClosed(webpack);
    }).then(() => {
        console.log(`finally (2)`);
        const is3000Clear = checkPortClear(DEFAULT_RAILS_PORT);
        if (!is3000Clear) {
            console.log(`port ${DEFAULT_RAILS_PORT} is not clear!`);
            return 1;
        }
        const is3001Clear = checkPortClear(DEFAULT_FRONTEND_PORT);
        if (!is3001Clear) {
            console.log(`port ${DEFAULT_FRONTEND_PORT} is not clear!`);
            return 1;
        }
    
        console.log(`all done!`);
    })
}).then((result) => {
    console.log(`finally (3)`);
    // console.assert(!(rails?.isRunning), `${rails?.cmd} is still running!!! See ${rails?.pid}`);
    console.assert(!(cypress_rails?.isRunning), `${cypress_rails?.cmd} is stil running!! see ${cypress_rails?.pid}`);
    console.assert(!(webpack?.isRunning), `${webpack?.cmd} is stil running!! see ${webpack?.pid}`);

    const is3000Clear = checkPortClear(DEFAULT_RAILS_PORT);
    if (!is3000Clear) {
        console.log(`port ${DEFAULT_RAILS_PORT} is not clear!`);
        forceClose(cypress_rails_pid);
        return 1;
    }
    const is3001Clear = checkPortClear(DEFAULT_FRONTEND_PORT);
    if (!is3001Clear) {
        console.log(`port ${DEFAULT_FRONTEND_PORT} is not clear!`);
        forceClose(webpack_pid);
        return 1;
    }

    console.log(`all done! result: ${result}`);
    process.exit(result);
})
