import fs from'node:fs/promises';import path from'node:path';import sharp from'sharp';import{fileURLToPath,pathToFileURL}from'node:url';
export async function galleryPreviews(root,{check=false}={}){
 const photos=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));let bytes=0;
 for(const photo of photos){
  if(!/^\.\/media\/photo-\d{2,}\.webp$/.test(photo.image)||photo.preview!==photo.image.replace('.webp','-preview.webp'))throw Error('Unexpected gallery preview path');
  const source=path.join(root,photo.image),target=path.join(root,photo.preview);
  if(!check)await sharp(source).resize({width:320,height:320,fit:'inside',withoutEnlargement:true}).webp({quality:76,effort:5}).toFile(target);
  const meta=await sharp(target).metadata(),original=await sharp(source).metadata();
  if(meta.format!=='webp'||Math.max(meta.width,meta.height)>320||meta.exif||Math.abs(meta.width/meta.height-original.width/original.height)>.01)throw Error('Invalid preview dimensions or metadata: '+photo.id);
  bytes+=(await fs.stat(target)).size;
 }
 return{photos:photos.length,bytes,width:320,format:'webp',spaceAndSingle:'Existing 640/1600px files retained'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log(JSON.stringify(await galleryPreviews(fileURLToPath(new URL('../../public/gallery/',import.meta.url)),{check:process.argv.includes('--check')})));
