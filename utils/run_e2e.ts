import execSh from 'exec-sh'; 


function main() {
    const rails = execSh.promise("rails s", undefined)

    const dump = (value: {stderr: string, stdout: string}) => {
        console.log(value.stderr);
        console.log(value.stdout);
    }

    

    let modifiedEnv = process.env;
    modifiedEnv.PORT = '3001';

    const reactDir = process.cwd() + '/../co2_client';
    modifiedEnv.cwd = reactDir;
    console.log(reactDir)
    const react = execSh.promise("yarn start", modifiedEnv);
    rails.then(dump)
    react.then(dump);
}

main()