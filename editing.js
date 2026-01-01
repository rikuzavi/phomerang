let navbtn = document.getElementsByClassName('navbtn')

let toolpanel = document.getElementsByClassName('toolpanel')[0]
let croppanel = document.getElementsByClassName('croppanel')[0]
let filterpanel = document.getElementsByClassName('filterpanel')[0]
let aipanel = document.getElementsByClassName('aipanel')[0]
let imgdragging = false

// navbtn is looped through and clicked through TOOLS, CROP, FILTER, AND AI panel
for(let i of navbtn){
    i.addEventListener('click',()=>{
        if(i.innerHTML == 'tools'){
            toolpanel.style.width = '100%'
            toolpanel.style.overflow = 'auto'
            croppanel.style.width = '0px'
            croppanel.style.overflow='hidden'
            filterpanel.style.width = '0px'
            filterpanel.style.overflow='hidden'
            aipanel.style.width = '0px'
            aipanel.style.overflow='hidden'
            imgdragging=false
           
          }
          else if(i.innerHTML == 'crop'){
            croppanel.style.width = '100%'
            croppanel.style.overflow = 'auto'
            toolpanel.style.width = '0px'
            toolpanel.style.overflow='hidden'
            filterpanel.style.width = '0px'
            filterpanel.style.overflow='hidden'
            aipanel.style.width = '0px'
            aipanel.style.overflow='hidden'
            imgdragging=true
            
          }
          else if(i.innerHTML == 'filter'){
            filterpanel.style.width = '100%'
            filterpanel.style.overflow = 'auto'
            toolpanel.style.width = '0px'
            toolpanel.style.overflow='hidden'
            croppanel.style.width = '0px'
            croppanel.style.overflow='hidden'
            aipanel.style.width = '0px'
            aipanel.style.overflow='hidden'
            imgdragging=false
          }
          else if(i.innerHTML == 'Ai'){
            aipanel.style.width = '100%'
            aipanel.style.overflow = 'auto'
            toolpanel.style.width = '0px'
            toolpanel.style.overflow='hidden'
            croppanel.style.width = '0px'
            croppanel.style.overflow='hidden'
            filterpanel.style.width = '0px'
            filterpanel.style.overflow='hidden'
            imgdragging=false
        }
    })
}


let imgselect = document.getElementById('imgselect')
let imgdiv = document.getElementById('imgdiv')
// Rendering image  through the local storage 
function showImg(src) {
  imgdiv.innerHTML = `
  <div id="crop-container" class="relative h-[100%] overflow-hidden">
    <img class="relative h-[100%] object-contain none" src="${src}" id="mainimg">
    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(0,0,0,0)_40%,rgba(0,0,0,0)_100%)]" id="frame"></div>
      <div id="grainframe"
        class="absolute inset-0 pointer-events-none 
          bg-[url('./grain.png')]
          bg-cover
          opacity-0
         ">
      </div>
      <div id="colorframe"
        class="absolute inset-0 pointer-events-none 
          bg-[transparent] opacity-15 mix-blend-overlay z-2">
      </div>
      <div id="gradientframe"
        class="absolute inset-0 pointer-events-none opacity-100 mix-blend-overlay z-2">
      </div>
      <div id="filters"
        class="absolute inset-0 pointer-events-none opacity-100 none">
      </div>
      <div id="textures"
        class="bg-cover absolute inset-0 opacity-20">
      </div>
      
    </div>
  `;
  
}

// Restore img from sessionStorage on reload
if (localStorage.imgurl) {
  showImg(localStorage.imgurl);
}
// compressing img to 3mb 
// as session cannot store big 25mb or more mb image data
async function compressImageTo3MB(file, maxMB = 3, qualityStep = 0.05) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        // Enable better downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        let width = img.width;
        let height = img.height;

        // Dynamically reduce big 8K images until under target MB
        let scale = 1;
        const MAX_DIMENSION = 3500; // good balance of detail & size

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          scale = MAX_DIMENSION / Math.max(width, height);
          width *= scale;
          height *= scale;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Start from high quality; reduce slightly if still large
        let quality = 0.9;
        let base64;
        let sizeInMB;

        do {
          base64 = canvas.toDataURL('image/jpeg', quality);
          const stringLength = base64.length - 'data:image/jpeg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
          sizeInMB = sizeInBytes / (1024 * 1024);

          if (sizeInMB > maxMB) {
            // reduce dimensions slightly instead of quality
            width *= 0.9;
            height *= 0.9;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
          } else {
            break;
          }

          // lower quality only if resizing isn't enough
          if (sizeInMB > maxMB * 1.1) quality -= qualityStep;

        } while (sizeInMB > maxMB && quality > 0.7);

        console.log(`✅ Final size: ${sizeInMB.toFixed(2)} MB, quality=${quality.toFixed(2)}, width=${Math.round(width)}px`);
        resolve(base64);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// when selected image new the convert and save rerun the showIMg function
imgselect.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const compressedBase64 = await compressImageTo3MB(file);
  localStorage.setItem("imgurl", compressedBase64);
  showImg(compressedBase64);
  location.reload();
});

// Hexadecimal to RGB value
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  return { r, g, b };
}

// main Tools panel chnaging begins here
let mainimg = document.getElementById('mainimg')
let frame = document.getElementById('frame')
let colorframe = document.getElementById('colorframe')
let ran =document.getElementsByClassName('ran')
// setting variables for style.filters
let br = 100
let con = 100
let sat = 100
let bw = 0
let hue = 0 
let blr =0
let neg =0
let vin=0
//looping through the rage of "ran"
// when input event then change the filters and vignete
// vignete frame is there and changing it 
// grain frame is manupulated
// for tint color frame is manupulated
for(let i of ran){
  i.addEventListener('input',()=>{
        if(i.name == 'vignete'){
            let vignetecolor = document.getElementById('vignetecolor')
            let {r,g,b} = hexToRgb(vignetecolor.value);
            frame.classList.replace(frame.classList[3],`bg-[radial-gradient(circle,rgba(${r},${g},${b},${i.value/150})_40%,rgba(${r},${g},${b},${i.value/50})_100%)]`)
        }
        else if (i.name == 'brightness') {
            br = 30 + (i.value / 200) * (300 - 30);
        }
        else if (i.name == 'contrast') {
            con = 30 + (i.value / 200) * (600 - 30);
          }
        else if(i.name == 'saturation'){
            sat = 30 + (i.value / 200) * (600 - 30);  
          }
        else if(i.name == 'bandw'){
            bw = 30 + (i.value / 200) * (150 - 30);  
        }
        else if(i.name == 'hue'){
            hue = (i.value / 100) * 360;
        }
        else if(i.name == 'smooth'){
            blr = (i.value*0.5/100)
        }
        else if(i.name == 'grain'){
            let grainframe = document.getElementById("grainframe");
            grainframe.style.opacity = i.value / 100;
        }
        else if(i.name == 'neg'){
            neg = i.value/100
        }
        else if(i.name == 'tint'){
            colorframe.classList.replace(colorframe.classList[4], `opacity-${i.value/2}`)
        }else if(i.name == 'vintage'){
            vin = i.value
        }
        mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;  
    })
}
// selecting the tint color
let tintcolor = document.getElementById('tintcolor')
tintcolor.addEventListener('input',()=>{
    colorframe.classList.replace(colorframe.classList[3], `bg-[${tintcolor.value}]`)
})

// tint strength chnaging means the mix blend mode 
let tintstrength = document.getElementsByClassName('tintstrength')
for(let i of tintstrength){
    i.addEventListener('click',()=>{
      if (i.innerHTML == 'normal') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-normal`);
      } else if (i.innerHTML == 'multiply') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-multiply`);
      } else if (i.innerHTML == 'screen') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-screen`);
      } else if (i.innerHTML == 'overlay') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-overlay`);
      } else if (i.innerHTML == 'darken') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-darken`);
      } else if (i.innerHTML == 'lighten') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-lighten`);
      } else if (i.innerHTML == 'color-dodge') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-color-dodge`);
      } else if (i.innerHTML == 'color-burn') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-color-burn`);
      } else if (i.innerHTML == 'hard-light') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-hard-light`);
      } else if (i.innerHTML == 'soft-light') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-soft-light`);
      } else if (i.innerHTML == 'difference') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-difference`);
      } else if (i.innerHTML == 'exclusion') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-exclusion`);
      } else if (i.innerHTML == 'hue') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-hue`);
      } else if (i.innerHTML == 'saturation') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-saturation`);
      } else if (i.innerHTML == 'color') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-color`);
      } else if (i.innerHTML == 'luminosity') {
        colorframe.classList.replace(colorframe.classList[5], `mix-blend-luminosity`);
      }

    })
}

//gradient tint begins here
let gradframe = document.getElementById('gradientframe');
// default colors
let firc = 'transparent';
let secc = 'transparent';
let thic = 'transparent';
let forc = 'transparent';
let fifc = 'transparent';
// default percentages
let firper = 0;
let secper = 25;
let thiper = 50;
let forper = 75;
let fifper = 100;

let direction= "to bottom"
// 🔥 function to rebuild gradient safely
function updateGradient() {
  gradframe.style.backgroundImage = `
    linear-gradient(${direction},
      ${firc} ${firper}%,
      ${secc} ${secper}%,
      ${thic} ${thiper}%,
      ${forc} ${forper}%,
      ${fifc} ${fifper}%)
  `;
}

// handle checkboxes of gradient if selected
document.querySelectorAll('#colorscheme input[type="checkbox"]').forEach((checkbox, index) => {
  checkbox.addEventListener('change', () => {
    const colorInput = document.querySelector(`.col${index + 1}`);
    const numberInput = document.querySelector(`.colorper${index + 1}`);

    if (checkbox.checked) {
      colorInput.removeAttribute('disabled');
      numberInput.removeAttribute('disabled');

      if (index === 0) firc = hexToRgba('#000000',0.5);;
      if (index === 1) secc = hexToRgba('#000000',0.5);;
      if (index === 2) thic = hexToRgba('#000000',0.5);;
      if (index === 3) forc = hexToRgba('#000000',0.5);;
      if (index === 4) fifc = hexToRgba('#000000',0.5);;
    } else {
      colorInput.setAttribute('disabled', true);
      numberInput.setAttribute('disabled', true);

      if (index === 0) firc = 'transparent';
      if (index === 1) secc = 'transparent';
      if (index === 2) thic = 'transparent';
      if (index === 3) forc = 'transparent';
      if (index === 4) fifc = 'transparent';
    }

    updateGradient();
  });
});

// handle color inputs
document.querySelectorAll('.col').forEach((input, index) => {
  input.addEventListener('input', () => {
    if (index === 0) firc = hexToRgba(input.value,0.5);
    if (index === 1) secc = hexToRgba(input.value,0.5);
    if (index === 2) thic = hexToRgba(input.value,0.5);
    if (index === 3) forc = hexToRgba(input.value,0.5);
    if (index === 4) fifc = hexToRgba(input.value,0.5);

    updateGradient();
  });
});

// handling gradient color percentage
document.querySelectorAll('.colorper').forEach((perInput) => {
  perInput.addEventListener('input', () => {
    const colorInput = perInput.parentElement.querySelector('input[type="color"]');
    const hex = colorInput.value;        // selected color (hex)
    const opacity = perInput.value || 100; // default 100%
    const rgba = hexToRgba(hex, opacity / 100);

    if(colorInput.name == 'col1'){
      firc =rgba
    }
    if(colorInput.name == 'col2'){
      secc =rgba
    }
    if(colorInput.name == 'col3'){
      thic =rgba
    }
    if(colorInput.name == 'col4'){
      forc =rgba
    }
    if(colorInput.name == 'col5'){
      fifc =rgba
    }
    updateGradient();
  });
});

// Hexa to RGBA converter
function hexToRgba(hex, alpha = 0) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substr(1, 2), 16);
    g = parseInt(hex.substr(3, 2), 16);
    b = parseInt(hex.substr(5, 2), 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

// changing the gradient direction 
document.querySelectorAll(".graddirec").forEach((direc)=>{
    direc.addEventListener("click",()=>{
      if(direc.id == "up"){
          direction = "to top"
      }else if(direc.id == "down"){
          direction = "to bottom"
      }else if(direc.id == "left"){
          direction = "to left"
      }else if(direc.id == "right"){
          direction = "to right"
      }else if(direc.id == "upright"){
          direction = "to top right"
      }else if(direc.id == "upleft"){
          direction = "to top left"
      }else if(direc.id == "downright"){
          direction = "to bottom right"
      }else if(direc.id == "downleft"){
          direction = "to bottom left"
      }
      updateGradient();
    })
})

// initialize upadte gradient once
updateGradient();

// filters begin here 
// css are applied for every class 
// when clicked then replace the filter class
let filter = document.getElementsByClassName("filter")
for(let i of filter){
    i.addEventListener('click',()=>{
        document.getElementById("filters").classList.replace(document.getElementById("filters").classList[4],i.name)
    })
}
let portraitfilter = document.getElementsByClassName("portraitfilter")
for(let i of portraitfilter){
    i.addEventListener('click',()=>{
        document.getElementById("filters").classList.replace(document.getElementById("filters").classList[4],i.name)
      })
}
let vintagefilter = document.getElementsByClassName("vintagefilter")
for(let i of vintagefilter){
    i.addEventListener('click',()=>{
        document.getElementById("filters").classList.replace(document.getElementById("filters").classList[4],i.name)
      })
}

// This is texture filter applied to the texture
let texturefilter = document.getElementsByClassName('texturefilter')
let textures = document.getElementById("textures")
let textureran = document.getElementsByClassName('textureran')[0]
textureran.addEventListener('input',()=>{
  textures.classList.replace(textures.classList[3],`opacity-${textureran.value}`)
})
for(let i of texturefilter){
    i.addEventListener('click',()=>{
      if(i.name == 'normal'){
        textures.style.background = "transparent"
      }
      else if(i.name == 'cyberpaint1'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759338020/cyberpaint_jxglf8.jpg")'
      }
      else if(i.name == 'cyberpaint2'){
        textures.style.backgroundImage = 'url("https://images.unsplash.com/photo-1543749247-18150e7fa4b0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bGVucyUyMGZsYXJlfGVufDB8fDB8fHww&fm=jpg&q=60&w=3000")'
      }
      else if(i.name == 'grainyblues'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339575/grainyblues_mdvsk0.jpg")'
      }
      else if(i.name == 'grainyold'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339644/grainyold_jtve3s.jpg")'
      }
      else if(i.name == 'grainyreds'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339704/grainyreds_xpgoko.jpg")'
      }
      else if(i.name == 'newblues'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339758/newblues_zx6tuk.jpg")'
      }
      else if(i.name == 'oldtv'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339812/oldtv_asftzq.jpg")'
      }
      else if(i.name == 'rainbowmix1'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339860/rainbowmix_ti4sqd.jpg")'
      }
      else if(i.name == 'rainbowmix2'){
        textures.style.backgroundImage = 'url("https://media.istockphoto.com/id/1352129151/photo/colorful-rainbow-crystal-light-leaks-on-black-background.jpg?s=612x612&w=0&k=20&c=32PYAfh-apMrbGfpORmcSjFy1f-v_9QUvG2bQUuR5Ms=")'
      }
      else if(i.name == 'rainbowwaves'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339924/rainbowwaves_erovdj.jpg")'
      }
      else if(i.name == 'rednblue1'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759339974/rednblue_ibwuxr.jpg")'
      }
      else if(i.name == 'rednblue2'){
        textures.style.backgroundImage = 'url("https://images.unsplash.com/photo-1718090393865-28e8bda481c8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGVucyUyMGZsYXJlfGVufDB8fDB8fHww&fm=jpg&q=60&w=3000")'
      }
      else if(i.name == 'soothingmix'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759340018/soothingmix_kzwooh.jpg")'
      }
      else if(i.name == 'tranquilsea'){
        textures.style.backgroundImage = 'url("https://res.cloudinary.com/dgc29vsua/image/upload/v1759340074/tranquilsea_txmpgr.jpg")'
      }
      else if(i.name == 'darkspotlight'){
        textures.style.backgroundImage = 'url("https://t4.ftcdn.net/jpg/01/98/24/71/360_F_198247162_JwrVkhqowZb4NJC24156nV6QYRhsV8Qf.jpg")'
      }
      else if(i.name == 'rainbow'){
        textures.style.backgroundImage = 'url("https://t3.ftcdn.net/jpg/02/47/22/80/360_F_247228043_eNXkq3rHjZiBsfQXFTHKMjBh9W0Vo4cI.jpg")'
      }
      else if(i.name == 'oldprint'){
        textures.style.backgroundImage = 'url("https://freebiehive.com/wp-content/uploads/2024/01/Retro-Old-Vintage-Overlay-758x473.jpg")'
      }
      else if(i.name == 'orangegliter'){
        textures.style.backgroundImage = 'url("https://videocdn.cdnpk.net/videos/3d3da60e-522f-425a-b31d-c3afc83b2edb/horizontal/thumbnails/large.jpg")'
      }
      else if(i.name == 'vintagevignete'){
        textures.style.backgroundImage = 'url("https://img.freepik.com/free-photo/vintage-vignitte-textured-paper-background_53876-108277.jpg?semt=ais_hybrid&w=740&q=80")'
      }
      else if(i.name == 'lense-glare01'){
        textures.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/previews/022/510/775/large_2x/rainbow-lens-optical-flare-film-dust-overlay-effect-vintage-abstract-bokeh-light-leaks-retro-camera-defocused-blur-reflection-bright-sunlights-use-screen-overlay-mode-for-processing-free-photo.jpg")'
      }
      else if(i.name == 'lense-glare02'){
        textures.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/previews/022/510/820/non_2x/rainbow-lens-optical-flare-film-dust-overlay-effect-vintage-abstract-bokeh-light-leaks-retro-camera-defocused-blur-reflection-bright-sunlights-use-screen-overlay-mode-for-processing-free-photo.jpg")'
      }
      else if(i.name == 'lense-glare03'){
        textures.style.backgroundImage = 'url("https://static.vecteezy.com/system/resources/previews/022/510/557/non_2x/rainbow-lens-optical-flare-film-dust-overlay-effect-vintage-abstract-bokeh-light-leaks-retro-camera-defocused-blur-reflection-bright-sunlights-use-screen-overlay-mode-for-processing-free-photo.jpg")'
      }
      else if(i.name == 'lense-glare04'){
        textures.style.backgroundImage = 'url("https://media.istockphoto.com/id/1417215285/photo/red-light-and-lens-flare.jpg?s=612x612&w=0&k=20&c=PKWmrkDhSDmPPOm-16nH3hIB8QhIZBbVDaAPCpZ_irw=")'
      }
      else if(i.name == 'bubble-blur1'){
        textures.style.backgroundImage = 'url("https://img.freepik.com/free-vector/realistic-bokeh-effect-background_23-2148966752.jpg")'
      }
    })
}

// cropping starts here
let cropran = document.getElementsByClassName('cropran')
let rotate = ''
let rotateX = ''
let rotateY = ''
let scale = ''
let posdragging = false;
let startX, startY;
let posX = 0, posY = 0;

// rotate, scaling , flip left, flip right, flip up, flip down
for(let i of cropran){
    i.addEventListener("input",()=>{
        if(i.name == 'rotate'){
          rotate = `rotate(${(i.value / 100) * 180}deg)`
        }
        else if(i.name == 'zoom'){
          scale = `scale(${i.value*0.05})`
        }
        cropcontainer.style.transform = `translate(${posX}px, ${posY}px) ${rotate} ${rotateX} ${rotateY} ${scale}`;
    })

    i.addEventListener('click',()=>{
        if(i.name == 'flip-left'){
          rotateY = `rotateY(180deg)`
        }
        else if(i.name == 'flip-right'){
          rotateY = `rotateY(0deg)`
        }
        else if(i.name == 'flip-up'){
          rotateX = `rotateX(180deg)`
        }
        else if(i.name == 'flip-down'){
          rotateX = `rotateX(0deg)`
        }
        cropcontainer.style.transform = `translate(${posX}px, ${posY}px) ${rotate} ${rotateX} ${rotateY} ${scale}`;
    })
}

// this part contains movement of the crop-container
// means if we want to adjust the conatiner position
document.getElementById('crop-container').addEventListener('mousedown', (e) => {
  if(!imgdragging) return;
  posdragging = true;
  mainimg.style.zIndex = 1
  startX = e.clientX;
  startY = e.clientY;
  e.preventDefault(); // prevent text/image selection
});

document.addEventListener('mousemove', (e) => {
  if (!posdragging) return;
  posX += e.clientX - startX;
  posY += e.clientY - startY;
  startX = e.clientX;
  startY = e.clientY;
  
  cropcontainer.style.transform = `translate(${posX}px, ${posY}px) ${rotate} ${rotateX} ${rotateY} ${scale}`;
});

document.addEventListener('mouseup', () => {
  mainimg.style.zIndex = 0
  posdragging = false;
});

// this part contains the left, right, top, bottom cropping and setting the width and height
// using clip path
let cropping=document.getElementsByClassName('cropping')
let cropcontainer = document.getElementById('crop-container')
let l=0
let r=0
let b=0
let t=0
for(let i of cropping){
  i.addEventListener('input',()=>{
    if(i.name=='leftcrop'){
      l=i.value
    }
    else if(i.name=='rightcrop'){
      r=i.value
    }
    if(i.name=='topcrop'){
      t=i.value
    }
    if(i.name=='bottomcrop'){
      b=i.value
    }
    cropcontainer.style.clipPath=`inset(${t}% ${r}% ${b}% ${l}%)`
  })
}

// when cropping is done then savecrop btn will save the crop container
document.getElementById('savecrop').addEventListener('click', () => {
  const mainimg = document.getElementById('mainimg');
  const cropContainer = document.getElementById('crop-container');
  if (!mainimg) return;

  const prevClip = cropContainer.style.clipPath;
  cropContainer.style.clipPath = 'none';

  const rect = mainimg.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const cropLeft = (l / 100) * width;
  const cropRight = (r / 100) * width;
  const cropTop = (t / 100) * height;
  const cropBottom = (b / 100) * height;

  const cropWidth = width - cropLeft - cropRight;
  const cropHeight = height - cropTop - cropBottom;

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = mainimg.src;
  img.onload = () => {
    ctx.drawImage(
      img,
      (img.width * cropLeft) / width,
      (img.height * cropTop) / height,
      (img.width * cropWidth) / width,
      (img.height * cropHeight) / height,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // ✅ Replace the old image with cropped one
    const croppedData = canvas.toDataURL('image/png');
    mainimg.src = croppedData;

    // Reset crop values and remove clipPath
    cropContainer.style.clipPath = 'none';
    l = r = t = b = 0;

    // Optionally resize container to fit the new cropped image
    mainimg.style.width = `${cropWidth}px`;
    mainimg.style.height = `${cropHeight}px`;
    for(let i of cropping){
      i.value = 0
    }
  };
});


// total reset button that resets everything
document.getElementById('totalreset').addEventListener('click',()=>{
  location.reload()
})
let redo = document.getElementsByClassName('redo');
for (let i of redo) {
  i.addEventListener('click', () => {
    if (i.getAttribute('name') === 'rotate') {
      document.getElementsByName('rotate')[0].value = 0;
      rotate = `rotate(0deg)`
      cropcontainer.style.transform = `translate(${posX}px, ${posY}px) ${rotate} ${rotateX} ${rotateY} ${scale}`;
    }
    else if (i.getAttribute('name') === 'zoom') {
      document.getElementsByName('zoom')[0].value = 0;
      scale = `scale(1)`
      cropcontainer.style.transform = `translate(${posX}px, ${posY}px) ${rotate} ${rotateX} ${rotateY} ${scale}`;
    }
    else if (i.getAttribute('name') === 'flip') {
      rotateY = `rotateY(0deg)`
      rotateX = `rotateX(0deg)`
      cropcontainer.style.transform = `translate(${posX}px, ${posY}px) ${rotate} ${rotateX} ${rotateY} ${scale}`;
    }
    else if (i.getAttribute('name') === 'crop') {
      location.reload()
    }
    else if (i.getAttribute('name') === 'brightness') {
      document.getElementsByName('brightness')[0].value = 50;
      br=100
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;   
    }
    else if (i.getAttribute('name') === 'contrast') {
      document.getElementsByName('contrast')[0].value = 50;
      con=100
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;   
    }
    else if (i.getAttribute('name') === 'saturation') {
      document.getElementsByName('saturation')[0].value = 50;
      sat=100
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;   
    }
    else if (i.getAttribute('name') === 'bandw') {
      document.getElementsByName('bandw')[0].value = 50;
      bw=0
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;   
    }
    else if (i.getAttribute('name') === 'grain') {
      document.getElementsByName('grain')[0].value = 50;
      let grainframe = document.getElementById("grainframe");
      grainframe.style.opacity = 0;
    }
    else if (i.getAttribute('name') === 'hue') {
      document.getElementsByName('hue')[0].value = 50;
      hue=0
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;
    }
    else if (i.getAttribute('name') === 'smooth') {
      document.getElementsByName('smooth')[0].value = 50;
      blr=0
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;
    }
    else if (i.getAttribute('name') === 'neg') {
      document.getElementsByName('neg')[0].value = 50;
      neg=0
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;
    }
    else if (i.getAttribute('name') === 'vignetecolor') {
      document.getElementsByName('vignete')[0].value = 50;
      frame.classList.replace(frame.classList[3],`bg-none`)
    }
    else if (i.getAttribute('name') === 'tint') {
      document.getElementsByName('tint')[1].value = 50
      document.getElementById('tintcolor').value = 'black'
      colorframe.classList.replace(colorframe.classList[3], `bg-none`)
      colorframe.classList.replace(colorframe.classList[4], `opacity-15`)
    }
    else if (i.getAttribute('name') === 'gradi') {
      gradframe.style.backgroundImage = 'none'
      document.getElementsByName('col1')[0].value = 'black'
      document.getElementsByName('col1')[0].disabled = true
      document.getElementsByName('colorper1')[0].value = 50
      document.getElementsByName('colorper1')[0].disabled = true
      document.getElementById('color1check').checked = false
      
      document.getElementsByName('col2')[0].value = 'black'
      document.getElementsByName('col2')[0].disabled = true
      document.getElementsByName('colorper2')[0].value = 50
      document.getElementsByName('colorper2')[0].disabled = true
      document.getElementById('color2check').checked = false
      
      document.getElementsByName('col3')[0].value = 'black'
      document.getElementsByName('col3')[0].disabled = true
      document.getElementsByName('colorper3')[0].value = 50
      document.getElementsByName('colorper3')[0].disabled = true
      document.getElementById('color3check').checked = false
      
      document.getElementsByName('col4')[0].value = 'black'
      document.getElementsByName('col4')[0].disabled = true
      document.getElementsByName('colorper4')[0].value = 50
      document.getElementsByName('colorper4')[0].disabled = true
      document.getElementById('color4check').checked = false
      
      document.getElementsByName('col5')[0].value = 'black'
      document.getElementsByName('col5')[0].disabled = true
      document.getElementsByName('colorper5')[0].value = 50
      document.getElementsByName('colorper5')[0].disabled = true
      document.getElementById('color5check').checked = false
    }else if (i.getAttribute('name') === 'vintage') {
      document.getElementsByName('vintage')[0].value = 0;
      vin=0
      mainimg.style.filter = `sepia(${vin}%) brightness(${br}%) contrast(${con}%) saturate(${sat}%) grayscale(${bw}%) hue-rotate(${hue}deg) blur(${blr}px) invert(${neg})`;
    }
    
  });
}


// whe download btn is clicked then it will open the imag in a new page 
// where you can take a sreenshot
// document.getElementById("downloadimg").addEventListener("click", () => {
//   const cropContainer = document.getElementById("imgdiv");
//   if (!cropContainer) return;

//   // Clone the div
//   const clone = cropContainer.cloneNode(true);

//   // Open a new tab
//   const newTab = window.open("./show.html", "_blank");

//   // Wait for the new tab to load fully
//   newTab.addEventListener("load", () => {
//     const frame = newTab.document.getElementById("frame");
//     if (!frame) return;

//     // Copy computed styles from the original container
//     const computed = window.getComputedStyle(cropContainer);
//     const propsToCopy = [
//       "width",
//       "height",
//       "transform",
//       "clipPath",
//       "objectFit",
//       "objectPosition",
//       "overflow",
//     ];

//     for (const prop of propsToCopy) {
//       clone.style[prop] = computed.getPropertyValue(prop);
//     }

//     // Fix container layout in new tab
//     clone.style.display = "flex";
//     clone.style.alignItems = "center";
//     clone.style.justifyContent = "center";
//     clone.style.margin = "auto";
//     clone.style.width = "95vw";
//     clone.style.height = "90vh";

//     // Copy all CSS <link> and <style> tags
//     const styles = Array.from(
//       document.querySelectorAll("link[rel=stylesheet], style")
//     )
//       .map((s) => s.outerHTML)
//       .join("\n");

//     newTab.document.head.innerHTML = styles;

//     // Append the cloned div inside #frame
//     frame.appendChild(clone);
//   });
// });


document.getElementById("downloadimg").addEventListener("click", async () => {
  
  document.getElementById('downloadimg').classList.replace(document.getElementById('downloadimg').classList[2],"fa-square")
  document.getElementById('downloadimg').classList.replace(document.getElementById('downloadimg').classList[3],"animate-spin")
  
  const div = document.getElementById("crop-container");

  const html = `
  <html>
  <head>
    <style>
      /* IMPORTANT: include your CSS here */
      ${document.querySelector("style")?.innerHTML || ""}
      ${Array.from(document.styleSheets)
        .map(s => {
          try { return Array.from(s.cssRules).map(r => r.cssText).join(""); }
          catch { return ""; }
        }).join("")}
    </style>
  </head>
  <body>
    ${div.outerHTML}
  </body>
  </html>`;

  const res = await fetch("https://phomerang-backend-m75dw8ame-shaswata-das-projects-54d16cf6.vercel.app/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html })
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "edited.png";
  a.click();
  console.log('done');
  
  document.getElementById('downloadimg').classList.replace(document.getElementById('downloadimg').classList[2],"fa-download")
  document.getElementById('downloadimg').classList.replace(document.getElementById('downloadimg').classList[3],"none")
});

