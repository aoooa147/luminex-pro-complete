import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const dir=path.join(root,'tmp_data');
function ensure(){ if(!fs.existsSync(dir)) fs.mkdirSync(dir); }
export function readJSON<T>(name:string,fallback:T):T{ ensure(); const p=path.join(dir,name+'.json'); try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return fallback; } }
export function writeJSON(name:string,data:any){ ensure(); const p=path.join(dir,name+'.json'); fs.writeFileSync(p, JSON.stringify(data,null,2),'utf-8'); }
