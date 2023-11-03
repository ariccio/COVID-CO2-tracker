import execSh from 'exec-sh'; 

type procHandle = ReturnType<typeof execSh.promise> | null;


let rails: procHandle = null;
let react: procHandle = null;

function main() {



    console.log('|||||||||||||||||||||||||||')
    rails = execSh.promise("rails s", undefined)

    const dump = (value: {stderr: string, stdout: string}) => {
        console.log('----------------------');
        console.log(value.stderr);
        console.log(value.stdout);
        console.log('----------------------');
    }

    

    let modifiedEnv = process.env;
    modifiedEnv.PORT = '3001';

    const reactDir = process.cwd() + '/../co2_client';
    modifiedEnv.cwd = reactDir;
    console.log(reactDir)
    react = execSh.promise("yarn start", modifiedEnv);
    rails.then(dump)
    react.then(dump);
}

try {
    main()
}