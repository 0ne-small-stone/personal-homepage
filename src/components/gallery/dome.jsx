import { createRoot } from 'react-dom/client';
import DomeGallery from './vendor/DomeGallery.jsx';
import './dome.css';

export const domeProps={fit:.8,minRadius:600,segments:34,dragDampening:2,maxVerticalRotationDeg:35,imageBorderRadius:'30px',openedImageBorderRadius:'30px',overlayBlurColor:'#000',grayscale:false,
  openedImageWidth:'min(400px, calc(100vw - 80px), calc(100svh - 200px))',openedImageHeight:'min(400px, calc(100vw - 80px), calc(100svh - 200px))'};

export function mountDome(host,photos,callbacks,reduceMotion){
  const root=createRoot(host);
  return new Promise(resolve=>{
    root.render(<DomeGallery {...domeProps} images={photos.map(photo=>({src:photo.image,preview:photo.preview,full:photo.full,alt:photo.title}))}
      fullCoverage responsive reduceMotion={reduceMotion}
      onMotion={callbacks.onMotion} onSelect={callbacks.onSelect} onOpenImage={callbacks.onOpenImage}
      onReady={api=>{api.unmount=()=>root.unmount();resolve(api);}}/>);
  });
}
