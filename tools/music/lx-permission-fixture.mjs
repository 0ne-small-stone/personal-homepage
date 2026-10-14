import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const results={};
for(const [name,operation] of Object.entries({readOutside:()=>readFileSync(process.argv[2]),write:()=>writeFileSync(process.argv[3],'denied'),spawn:()=>spawnSync(process.execPath,['-e','process.exit(0)'])})){
  try{operation();results[name]='allowed';}catch(error){results[name]=error.code;}
}
process.stdout.write(JSON.stringify(results));
