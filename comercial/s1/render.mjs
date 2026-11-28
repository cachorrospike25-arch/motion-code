import {createRequire} from 'module';const {chromium}=createRequire(import.meta.url)('playwright');
import fs from 'fs';
const out='/tmp/s1frames';fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.cwd()+'/pagina.html');
const FPS=30,N=15*FPS;
for(let i=0;i<N;i++){await p.evaluate(t=>window.quadro(t),i/FPS);
 const d=await p.evaluate(()=>document.getElementById('c').toDataURL('image/jpeg',.92).split(',')[1]);
 fs.writeFileSync(`${out}/f${String(i).padStart(4,'0')}.jpg`,Buffer.from(d,'base64'));}
await b.close();
