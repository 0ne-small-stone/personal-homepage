// A bounded, repeating photo grid in the otherwise empty sides of Dome Gallery.
export function createSideWall(main,photos,radius){
  const wall=document.createElement('div');wall.className='side-photo-wall';wall.setAttribute('aria-hidden','true');
  const track=document.createElement('div');track.className='side-photo-track';wall.append(track);main.append(wall);
  let cells=[],cols=0,rows=0,pitch=0,lastX=0,lastY=0,offsetX=0,offsetY=0,shiftX=NaN,shiftY=NaN,progress=0;
  const wrap=value=>((value+180)%360+360)%360-180;
  const api={radius,
    resize(nextRadius=api.radius){
      if(progress>0)return;
      api.radius=nextRadius;
      const gap=8,feather=Math.max(48,Math.min(100,main.clientWidth*.05));
      const curveRadius=nextRadius/Math.SQRT2+8;
      const clearRadius=curveRadius+gap;
      wall.style.setProperty('--side-clear-radius',`${clearRadius}px`);
      wall.style.setProperty('--side-fade-low',`${clearRadius+feather*.2}px`);
      wall.style.setProperty('--side-fade-mid',`${clearRadius+feather*.55}px`);
      wall.style.setProperty('--side-soft-radius',`${clearRadius+feather}px`);
      wall.dataset.gap=gap.toFixed(2);wall.dataset.feather=feather.toFixed(2);wall.dataset.curveRadius=curveRadius.toFixed(2);wall.dataset.clearRadius=clearRadius.toFixed(2);
      const nextPitch=Math.max(74,Math.min(132,nextRadius*6.28/34));
      const nextCols=Math.ceil(main.clientWidth/nextPitch)+4,nextRows=Math.ceil(main.clientHeight/nextPitch)+3;
      if(nextPitch===pitch&&nextCols===cols&&nextRows===rows)return;
      pitch=nextPitch;cols=nextCols;rows=nextRows;shiftX=shiftY=NaN;
      track.replaceChildren();cells=[];
      track.style.setProperty('--side-pitch',`${pitch}px`);track.style.gridTemplateColumns=`repeat(${cols},${pitch}px)`;
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const cell=document.createElement('div'),img=document.createElement('img');cell.className='side-photo-cell';
        img.alt='';img.draggable=false;img.decoding='async';cell.append(img);track.append(cell);cells.push({row,col,img,cell});
      }
      render();
    },
    rotate({x,y}){
      const gain=api.radius*Math.PI/180*.55;
      offsetX-=wrap(y-lastY)*gain;offsetY+=(x-lastX)*gain;lastX=x;lastY=y;render();
    },
    setProgress(value){if(value===progress)return;progress=value;wall.style.opacity=String(.48*(1-Math.min(1,value/.35)));},
    dispose(){observer.disconnect();wall.remove();}
  };
  function render(){
    if(!pitch)return;
    const sx=Math.floor(offsetX/pitch),sy=Math.floor(offsetY/pitch);
    if(sx!==shiftX||sy!==shiftY){
      for(const {row,col,img,cell} of cells){const worldRow=row-sy;const key=worldRow*7+(col-sx)*11;const photo=photos[((key%photos.length)+photos.length)%photos.length];const src=photo.preview||photo.image;if(img.getAttribute('src')!==src)img.src=src;cell.style.transform=worldRow%2?`translateX(${pitch*.5}px)`:'';}
      shiftX=sx;shiftY=sy;
    }
    track.style.transform=`translate3d(${offsetX-sx*pitch-pitch*2}px,${offsetY-sy*pitch-pitch}px,0)`;
    wall.dataset.stagger='half-step';
    wall.dataset.offsetX=offsetX.toFixed(3);wall.dataset.offsetY=offsetY.toFixed(3);wall.dataset.cells=String(cells.length);
  }
  const observer=new ResizeObserver(()=>api.resize());observer.observe(main);api.resize(radius);
  return api;
}
